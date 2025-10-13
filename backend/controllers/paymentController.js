const client = require('../db');
const stripe = require('stripe')('sk_test_51SAQMVKxTYGsGrGJ2gDXFmlQj5VwWXz7t7mwNjypZ4r1gVmgZUeVy8PkIGVQ4ciQQa1bmvEon68w1phGxyUBHNar00qTXNJyzC'); // Add this line

// Helper functions (you need to implement these)
const generateId = () => {
    return 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const savePaymentToDB = async (paymentData) => {
    try {
        const query = `
            INSERT INTO payments (id, user_id, amount, currency, status, stripe_payment_intent_id, 
                                 start_location, end_location, route_id, bus_number, distance_km)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;
        const values = [
            paymentData.id,
            paymentData.userId,
            paymentData.amount,
            'lkr',
            paymentData.status,
            paymentData.stripePaymentIntentId,
            paymentData.startLocation,
            paymentData.endLocation,
            paymentData.routeId,
            paymentData.busNumber,
            paymentData.distance
        ];
        
        await client.query(query, values);
        console.log('Payment saved to database:', paymentData.id);
    } catch (error) {
        console.error('Error saving payment to DB:', error);
        throw error;
    }
};

const updatePaymentStatus = async (stripePaymentIntentId, status) => {
    try {
        const query = 'UPDATE payments SET status = $1, updated_at = NOW() WHERE stripe_payment_intent_id = $2';
        await client.query(query, [status, stripePaymentIntentId]);
        console.log('Payment status updated:', stripePaymentIntentId, status);
    } catch (error) {
        console.error('Error updating payment status:', error);
        throw error;
    }
};

const createTicket = async (ticketData) => {
    try {
        const ticketId = 'ticket_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const query = `
            INSERT INTO tickets (id, payment_id, user_id, start_location, end_location, 
                                route_id, bus_number, fare, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        const values = [
            ticketId,
            ticketData.paymentId,
            ticketData.userId,
            ticketData.startLocation,
            ticketData.endLocation,
            ticketData.routeId,
            ticketData.busNumber,
            ticketData.fare,
            'active'
        ];
        
        const result = await client.query(query, values);
        console.log('Ticket created:', ticketId);
        return result.rows[0];
    } catch (error) {
        console.error('Error creating ticket:', error);
        throw error;
    }
};

const handleSuccessfulPayment = async (paymentIntent) => {
    try {
        // Update payment status in database
        await updatePaymentStatus(paymentIntent.id, 'completed');
        
        // You can add additional logic here like sending email notifications, etc.
        console.log('Webhook: Payment succeeded for:', paymentIntent.id);
    } catch (error) {
        console.error('Error handling successful payment:', error);
    }
};

// 1. Create Payment Intent
const createPaymentIntent = async (req, res) => {
    try {
        const { amount, currency, userId, ticketDetails } = req.body;
        
        // Validate required fields
        if (!amount || !userId || !ticketDetails) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount), // Amount is already in cents from frontend
            currency: currency || 'lkr',
            metadata: {
                userId: userId.toString(),
                startLocation: ticketDetails.startLocation || 'Unknown',
                endLocation: ticketDetails.endLocation || 'Unknown',
                routeId: ticketDetails.routeId || 'Unknown',
                busNumber: ticketDetails.busNumber || 'Unknown',
                distance: ticketDetails.distance?.toString() || '0'
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        // Save to database
        await savePaymentToDB({
            id: generateId(),
            userId: userId,
            amount: amount / 100, // Convert back to LKR from cents
            stripePaymentIntentId: paymentIntent.id,
            status: 'pending',
            startLocation: ticketDetails.startLocation,
            endLocation: ticketDetails.endLocation,
            routeId: ticketDetails.routeId,
            busNumber: ticketDetails.busNumber,
            distance: ticketDetails.distance
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: error.message });
    }
};

const getPaymentByStripeId = async (stripePaymentIntentId) => {
  try {
    const query = 'SELECT * FROM payments WHERE stripe_payment_intent_id = $1';
    const result = await client.query(query, [stripePaymentIntentId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error getting payment by stripe id:', error);
    throw error;
  }
};

const confirmPayment = async (req, res) => {
  try {
    console.log('confirmPayment called, body:', req.body);
    const { paymentIntentId, ticketDetails } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'paymentIntentId is required' });
    }

    // Retrieve PaymentIntent from Stripe and log status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('Stripe paymentIntent:', paymentIntent.id, 'status:', paymentIntent.status);

    // If payment is not succeeded, return status for debugging
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        error: 'Payment not successful',
        status: paymentIntent.status,
      });
    }

    // Get full payment record from DB (so we can read user_id and payment id)
    const paymentRecord = await getPaymentByStripeId(paymentIntentId);
    if (!paymentRecord) {
      console.error('Payment record not found for stripe id:', paymentIntentId);
      return res.status(404).json({ error: 'Payment record not found' });
    }
    console.log('Found paymentRecord:', paymentRecord);

    // Resolve userId (prefer ticketDetails.userId, fallback to saved payment.user_id)
    const userId = ticketDetails?.userId || paymentRecord.user_id;
    if (!userId) {
      console.error('No userId available for ticket creation. ticketDetails:', ticketDetails, 'paymentRecord.user_id:', paymentRecord.user_id);
      return res.status(400).json({ error: 'User ID not available for ticket creation' });
    }

    // Build ticket payload using provided details or values stored with payment
    const ticketPayload = {
      paymentId: paymentRecord.id,
      userId: userId,
      startLocation: ticketDetails?.startLocation || paymentRecord.start_location,
      endLocation: ticketDetails?.endLocation || paymentRecord.end_location,
      routeId: ticketDetails?.routeId || paymentRecord.route_id,
      busNumber: ticketDetails?.busNumber || paymentRecord.bus_number,
      fare: ticketDetails?.fare ?? paymentRecord.amount
    };

    // Create ticket
    const ticket = await createTicket(ticketPayload);
    console.log('Ticket created successfully:', ticket.id || ticket);

    // Update payment status to completed
    await updatePaymentStatus(paymentIntentId, 'completed');

    return res.json({
      success: true,
      ticket,
      message: 'Payment confirmed and ticket created'
    });
  } catch (error) {
    console.error('Error in confirmPayment:', error);
    return res.status(500).json({ error: error.message || String(error) });
  }
};

// 3. Webhook for payment status updates
const webhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Construct the event using the raw body and signature
        event = stripe.webhooks.constructEvent(
            req.body, 
            sig, 
            'whsec_your_webhook_secret_here' // Replace with your webhook secret
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            await handleSuccessfulPayment(paymentIntent);
            break;
        case 'payment_intent.payment_failed':
            const failedPaymentIntent = event.data.object;
            console.log('Payment failed:', failedPaymentIntent.id);
            await updatePaymentStatus(failedPaymentIntent.id, 'failed');
            break;
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
};

module.exports = {
   createPaymentIntent,
   getPaymentByStripeId,
   confirmPayment,
   webhook 
};