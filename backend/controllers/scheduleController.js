const { client } = require('../db');

// Add new schedule
exports.addSchedule = async (req, res) => {
  const { 
    route_id, 
    bus_id, 
    driver_id, 
    departure_time, 
    arrival_time, 
    day_of_week = 'Daily', 
    status = 'ACTIVE' 
  } = req.body;
  const added_by = req.user.userId;

  try {
    // Check if route exists
    const routeCheck = await client.query('SELECT * FROM routes WHERE id = $1', [route_id]);
    if (routeCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Check if bus exists
    const busCheck = await client.query('SELECT * FROM buses WHERE id = $1', [bus_id]);
    if (busCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    // Check if driver exists and is actually a driver
    if (driver_id) {
      const driverCheck = await client.query(
        'SELECT * FROM users WHERE id = $1 AND role = $2',
        [driver_id, 'DRIVER']
      );
      if (driverCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid driver ID or user is not a driver' });
      }
    }

    // Check for schedule conflicts (same bus at same time)
    const conflictCheck = await client.query(
      `SELECT * FROM schedules 
       WHERE bus_id = $1 AND departure_time = $2 AND day_of_week = $3 AND status = 'ACTIVE'`,
      [bus_id, departure_time, day_of_week]
    );
    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({ message: 'Bus already scheduled at this time' });
    }

    const result = await client.query(
      `INSERT INTO schedules (route_id, bus_id, driver_id, departure_time, arrival_time, day_of_week, status, added_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [route_id, bus_id, driver_id, departure_time, arrival_time, day_of_week, status, added_by]
    );

    res.status(201).json({
      message: 'Schedule added successfully',
      schedule: result.rows[0]
    });
  } catch (err) {
    console.error('Error adding schedule:', err);
    res.status(500).json({ message: 'Error adding schedule' });
  }
};

// Get all schedules with details
exports.getAllSchedules = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT 
        s.*,
        r.route_name,
        r.start_location,
        r.end_location,
        b.bus_number,
        b.plate_number,
        d.name as driver_name,
        u.name as added_by_name
       FROM schedules s
       LEFT JOIN routes r ON s.route_id = r.id
       LEFT JOIN buses b ON s.bus_id = b.id
       LEFT JOIN users d ON s.driver_id = d.id
       LEFT JOIN users u ON s.added_by = u.id
       ORDER BY s.departure_time, s.day_of_week`
    );

    const schedules = result.rows;

    res.status(200).json({
      message: 'Schedules retrieved successfully',
      count: schedules.length,
      schedules: schedules
    });
  } catch (err) {
    console.error('Error fetching schedules:', err);
    res.status(500).json({ message: 'Error retrieving schedules' });
  }
};

// Update schedule
exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { route_id, bus_id, driver_id, departure_time, arrival_time, day_of_week, status } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Check if schedule exists and user has permission
    let checkQuery = 'SELECT * FROM schedules WHERE id = $1';
    let checkParams = [id];

    // Regular admins can only update their own schedules
    if (userRole === 'ADMIN') {
      checkQuery += ' AND added_by = $2';
      checkParams.push(userId);
    }

    const checkResult = await client.query(checkQuery, checkParams);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Schedule not found or unauthorized' });
    }

    // Check for schedule conflicts (excluding current schedule)
    if (bus_id && departure_time && day_of_week) {
      const conflictCheck = await client.query(
        `SELECT * FROM schedules 
         WHERE bus_id = $1 AND departure_time = $2 AND day_of_week = $3 AND id != $4 AND status = 'ACTIVE'`,
        [bus_id, departure_time, day_of_week, id]
      );
      if (conflictCheck.rows.length > 0) {
        return res.status(409).json({ message: 'Bus already scheduled at this time' });
      }
    }

    const result = await client.query(
      `UPDATE schedules 
       SET route_id = COALESCE($1, route_id), 
           bus_id = COALESCE($2, bus_id), 
           driver_id = COALESCE($3, driver_id), 
           departure_time = COALESCE($4, departure_time), 
           arrival_time = COALESCE($5, arrival_time), 
           day_of_week = COALESCE($6, day_of_week), 
           status = COALESCE($7, status), 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 
       RETURNING *`,
      [route_id, bus_id, driver_id, departure_time, arrival_time, day_of_week, status, id]
    );

    res.status(200).json({
      message: 'Schedule updated successfully',
      schedule: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating schedule:', err);
    res.status(500).json({ message: 'Error updating schedule' });
  }
};

// Delete schedule
exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    let query = 'DELETE FROM schedules WHERE id = $1';
    let queryParams = [id];

    // Regular admins can only delete their own schedules
    if (userRole === 'ADMIN') {
      query += ' AND added_by = $2';
      queryParams.push(userId);
    }

    query += ' RETURNING *';

    const result = await client.query(query, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Schedule not found or unauthorized' });
    }

    res.status(200).json({
      message: 'Schedule deleted successfully',
      schedule: result.rows[0]
    });
  } catch (err) {
    console.error('Error deleting schedule:', err);
    res.status(500).json({ message: 'Error deleting schedule' });
  }
};