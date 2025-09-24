const express = require('express');
const router = express.Router();
const { createPaymentIntent, confirmPayment, webhook } = require('../controllers/paymentController');

// // Add authentication middleware to all routes
// const authenticateToken = require('../middleware/authMiddleware');
// router.use(authenticateToken);

// Add new bus
router.post('/create-payment-intent', createPaymentIntent);
router.post('/confirm-payment', confirmPayment);
router.post('/webhook', webhook);

module.exports = router;