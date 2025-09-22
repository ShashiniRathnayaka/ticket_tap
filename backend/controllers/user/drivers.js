const client = require('../../db');

const getDriversSchedule = async (req, res) => {
  try {
    // Get driver ID from the authenticated token
    const driverId = req.user.userId;
    
    // Get today's date information
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Determine which schedules to show based on today
    let dayFilter = '';
    let queryParams = [driverId];
    
    if (isWeekend) {
      dayFilter = `(s.day_of_week = 'Weekends' OR s.day_of_week = 'Daily')`;
    } else {
      dayFilter = `(s.day_of_week = 'Weekdays' OR s.day_of_week = 'Daily')`;
    }
    
    // For specific day schedules (like MONDAY, TUESDAY, etc.)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[dayOfWeek];
    dayFilter += ` OR s.day_of_week = $${queryParams.length + 1}`;
    queryParams.push(todayName);

    const query = `
      SELECT 
        s.id,
        s.departure_time,
        s.arrival_time,
        s.day_of_week,
        s.status,
        r.id as route_id,
        r.start_location,
        r.end_location,
        r.distance,
        r.estimated_time,
        b.bus_number,
        b.capacity,
        b.bus_type,
        b.plate_number as license_plate,
        u.name as driver_name,
        u.mobile_number as driver_phone
      FROM schedules s
      INNER JOIN routes r ON s.route_id = r.id
      INNER JOIN buses b ON s.bus_id = b.id
      INNER JOIN users u ON s.driver_id = u.id
      WHERE s.driver_id = $1 
        AND s.status = 'ACTIVE'
        AND (${dayFilter})
      ORDER BY s.departure_time
    `;
    
    const result = await client.query(query, queryParams);
    
    // Format the response with more useful information
    const schedules = result.rows.map(schedule => ({
      schedule_id: schedule.id,
      departure_time: schedule.departure_time,
      arrival_time: schedule.arrival_time,
      day_of_week: schedule.day_of_week,
      status: schedule.status,
      route: {
        route_id: schedule.route_id,
        start_location: schedule.start_location,
        end_location: schedule.end_location,
        distance: schedule.distance,
        estimated_time: schedule.estimated_time
      },
      bus: {
        bus_number: schedule.bus_number,
        capacity: schedule.capacity,
        bus_type: schedule.bus_type,
        license_plate: schedule.license_plate
      },
      driver: {
        name: schedule.driver_name,
        phone: schedule.driver_phone
      }
    }));
    
    res.json({
      success: true,
      date: today.toISOString().split('T')[0],
      day_of_week: todayName,
      total_schedules: schedules.length,
      schedules: schedules
    });
    
  } catch (error) {
    console.error('Error fetching driver schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching schedules'
    });
  }
};

// Get driver's schedule history
// router.get('/:driverId/history', authenticateToken, async (req, res) => {
const getScheduleHistory = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT 
        s.id,
        s.departure_time,
        s.arrival_time,
        s.day_of_week,
        s.status,
        r.route_number,
        r.start_location,
        r.end_location,
        b.bus_number,
        u.name as driver_name,
        s.created_at
      FROM schedules s
      INNER JOIN routes r ON s.route_id = r.id
      INNER JOIN buses b ON s.bus_id = b.id
      INNER JOIN users u ON s.driver_id = u.id
      WHERE s.driver_id = $1
      ORDER BY s.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = 'SELECT COUNT(*) FROM schedules WHERE driver_id = $1';
    
    const [schedulesResult, countResult] = await Promise.all([
      client.query(query, [driverId, limit, offset]),
      client.query(countQuery, [driverId])
    ]);
    
    res.json({
      success: true,
      schedules: schedulesResult.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    console.error('Error fetching driver history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching history'
    });
  }
};

// Start a trip (update schedule status)
// router.patch('/:driverId/schedules/:scheduleId/start', authenticateToken, async (req, res) => {
const startTrip = async (req, res) => {
  try {
    const { driverId, scheduleId } = req.params;
    
    const query = `
      UPDATE schedules 
      SET status = 'IN_PROGRESS', 
          started_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND driver_id = $2
      RETURNING *
    `;
    
    const result = await client.query(query, [scheduleId, driverId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }
    
    res.json({
      success: true,
      schedule: result.rows[0],
      message: 'Trip started successfully'
    });
  } catch (error) {
    console.error('Error starting trip:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting trip'
    });
  }
};

// End a trip
// router.patch('/:driverId/schedules/:scheduleId/end', authenticateToken, async (req, res) => {
const endTrip = async (req, res) => {
  try {
    const { driverId, scheduleId } = req.params;
    
    const query = `
      UPDATE schedules 
      SET status = 'COMPLETED', 
          ended_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND driver_id = $2
      RETURNING *
    `;
    
    const result = await client.query(query, [scheduleId, driverId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }
    
    res.json({
      success: true,
      schedule: result.rows[0],
      message: 'Trip ended successfully'
    });
  } catch (error) {
    console.error('Error ending trip:', error);
    res.status(500).json({
      success: false,
      message: 'Error ending trip'
    });
  }
};

module.exports = {
  getDriversSchedule,
  getScheduleHistory,
  startTrip,
  endTrip
};