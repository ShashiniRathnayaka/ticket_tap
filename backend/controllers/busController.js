const client = require('../db');

// Add new bus (with admin ownership)
const addBus = async (req, res) => {
  const { 
    bus_number, 
    plate_number, 
    capacity, 
    bus_type, 
    status = 'ACTIVE', 
    driver_id 
  } = req.body;

  // Get the admin ID from the authenticated user
  const added_by = req.user.userId;

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
        bus_number, plate_number, capacity, bus_type, status, driver_id, added_by
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [bus_number, plate_number, capacity, bus_type, status, driver_id, added_by]
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

// Get all buses (admin sees only their own buses, super admin sees all)
const getAllBuses = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    let query = `
      SELECT 
        b.*,
        u.name as driver_name,
        u.email as driver_email,
        admin.name as added_by_name
      FROM buses b
      LEFT JOIN users u ON b.driver_id = u.id
      LEFT JOIN users admin ON b.added_by = admin.id
    `;
    
    let queryParams = [];

    // Regular admins can only see their own buses
    if (userRole === 'ADMIN') {
      query += ' WHERE b.added_by = $1';
      queryParams.push(userId);
    }
    // Super admin can see all buses
    else if (userRole === 'SUPER_ADMIN') {
      // No filter needed
    }

    query += ' ORDER BY b.created_at DESC';

    const result = await client.query(query, queryParams);
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

// Get bus by ID (with ownership check)
const getBusById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    let query = `
      SELECT 
        b.*,
        u.name as driver_name,
        u.email as driver_email,
        admin.name as added_by_name
      FROM buses b
      LEFT JOIN users u ON b.driver_id = u.id
      LEFT JOIN users admin ON b.added_by = admin.id
      WHERE b.id = $1
    `;
    
    let queryParams = [id];

    // Regular admins can only access their own buses
    if (userRole === 'ADMIN') {
      query += ' AND b.added_by = $2';
      queryParams.push(userId);
    }

    const result = await client.query(query, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Bus not found or unauthorized' });
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

// Update bus (with ownership check)
const updateBus = async (req, res) => {
  try {
    const { id } = req.params;
    const { bus_number, plate_number, capacity, bus_type, status, driver_id } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // First check if bus exists and user has permission
    let checkQuery = 'SELECT * FROM buses WHERE id = $1';
    let checkParams = [id];

    if (userRole === 'ADMIN') {
      checkQuery += ' AND added_by = $2';
      checkParams.push(userId);
    }

    const checkResult = await client.query(checkQuery, checkParams);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Bus not found or unauthorized' });
    }

    // Check for duplicate bus number (excluding current bus)
    if (bus_number) {
      const busNumberCheck = await client.query(
        'SELECT * FROM buses WHERE bus_number = $1 AND id != $2', 
        [bus_number, id]
      );
      if (busNumberCheck.rows.length > 0) {
        return res.status(409).json({ message: 'Bus number already exists' });
      }
    }

    // Check for duplicate plate number (excluding current bus)
    if (plate_number) {
      const plateNumberCheck = await client.query(
        'SELECT * FROM buses WHERE plate_number = $1 AND id != $2', 
        [plate_number, id]
      );
      if (plateNumberCheck.rows.length > 0) {
        return res.status(409).json({ message: 'Plate number already exists' });
      }
    }

    // If driver_id is provided, verify driver exists
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
      `UPDATE buses 
       SET bus_number = COALESCE($1, bus_number), 
           plate_number = COALESCE($2, plate_number), 
           capacity = COALESCE($3, capacity), 
           bus_type = COALESCE($4, bus_type), 
           status = COALESCE($5, status), 
           driver_id = COALESCE($6, driver_id), 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 
       RETURNING *`,
      [bus_number, plate_number, capacity, bus_type, status, driver_id, id]
    );

    res.status(200).json({
      message: 'Bus updated successfully',
      bus: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating bus:', err);
    res.status(500).json({ message: 'Error updating bus' });
  }
};

// Delete bus (with ownership check)
const deleteBus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    let query = 'DELETE FROM buses WHERE id = $1';
    let queryParams = [id];

    // Regular admins can only delete their own buses
    if (userRole === 'ADMIN') {
      query += ' AND added_by = $2';
      queryParams.push(userId);
    }

    query += ' RETURNING *';

    const result = await client.query(query, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Bus not found or unauthorized' });
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

// Get buses by current admin (for dropdowns, etc.)
const getMyBuses = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await client.query(
      `SELECT 
        b.id,
        b.bus_number,
        b.plate_number,
        b.capacity,
        b.bus_type
       FROM buses b
       WHERE b.added_by = $1
       ORDER BY b.bus_number`,
      [userId]
    );

    const buses = result.rows;

    res.status(200).json({
      message: 'Buses retrieved successfully',
      count: buses.length,
      buses: buses
    });
  } catch (err) {
    console.error('Error fetching my buses:', err);
    res.status(500).json({ message: 'Error retrieving buses' });
  }
};

module.exports = {
  addBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus,
  getMyBuses
};