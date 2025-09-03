const  client = require('../db');

// Add new bus
const addBus = async (req, res) => {
  const { 
    bus_number, 
    plate_number, 
    capacity, 
    bus_type, 
    status = 'ACTIVE', 
    driver_id 
  } = req.body;

  try {
    // Check if bus number already exists
    const busNumberCheck = await client.query(
      'SELECT * FROM buses WHERE bus_number = $1', 
      [bus_number]
    );
    if (busNumberCheck.rows.length > 0) {
      return res.status(409).json({ message: 'Bus number already exists' });
    }

    // Check if plate number already exists
    const plateNumberCheck = await client.query(
      'SELECT * FROM buses WHERE plate_number = $1', 
      [plate_number]
    );
    if (plateNumberCheck.rows.length > 0) {
      return res.status(409).json({ message: 'Plate number already exists' });
    }

    // If driver_id is provided, verify driver exists and is actually a driver
    if (driver_id) {
      const driverCheck = await client.query(
        'SELECT * FROM users WHERE id = $1 AND role = $2',
        [driver_id, 'DRIVER']
      );
      if (driverCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid driver ID or user is not a driver' });
      }
    }

    const result = await client.query(
      `INSERT INTO buses (
        bus_number, plate_number, capacity, bus_type, status, driver_id
      ) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [bus_number, plate_number, capacity, bus_type, status, driver_id]
    );

    const bus = result.rows[0];

    res.status(201).json({
      message: 'Bus added successfully',
      bus: bus
    });
  } catch (err) {
    console.error('Error adding bus:', err);
    res.status(500).json({ message: 'Error adding bus' });
  }
};

// Get all buses
const getAllBuses = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT 
        b.*,
        u.name as driver_name,
        u.email as driver_email
       FROM buses b
       LEFT JOIN users u ON b.driver_id = u.id
       ORDER BY b.created_at DESC`
    );

    const buses = result.rows;

    res.status(200).json({
      message: 'Buses retrieved successfully',
      count: buses.length,
      buses: buses
    });
  } catch (err) {
    console.error('Error fetching buses:', err);
    res.status(500).json({ message: 'Error retrieving buses' });
  }
};

// Get bus by ID
const getBusById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await client.query(
      `SELECT 
        b.*,
        u.name as driver_name,
        u.email as driver_email
       FROM buses b
       LEFT JOIN users u ON b.driver_id = u.id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.status(200).json({
      message: 'Bus retrieved successfully',
      bus: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching bus:', err);
    res.status(500).json({ message: 'Error retrieving bus' });
  }
};

// Update bus
const updateBus = async (req, res) => {
  try {
    const { id } = req.params;
    const { bus_number, plate_number, capacity, bus_type, status, driver_id } = req.body;

    const result = await client.query(
      `UPDATE buses 
       SET bus_number = $1, plate_number = $2, capacity = $3, 
           bus_type = $4, status = $5, driver_id = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 
       RETURNING *`,
      [bus_number, plate_number, capacity, bus_type, status, driver_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.status(200).json({
      message: 'Bus updated successfully',
      bus: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating bus:', err);
    res.status(500).json({ message: 'Error updating bus' });
  }
};

// Delete bus
const deleteBus = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await client.query(
      'DELETE FROM buses WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.status(200).json({
      message: 'Bus deleted successfully',
      bus: result.rows[0]
    });
  } catch (err) {
    console.error('Error deleting bus:', err);
    res.status(500).json({ message: 'Error deleting bus' });
  }
};

// Export all functions using CommonJS
module.exports = {
  addBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus
};