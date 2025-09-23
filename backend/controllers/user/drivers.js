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
// const getScheduleHistory = async (req, res) => {
//   try {
//     const { driverId } = req.params;
//     const { page = 1, limit = 10 } = req.query;
//     const offset = (page - 1) * limit;
    
//     const query = `
//       SELECT 
//         s.id,
//         s.departure_time,
//         s.arrival_time,
//         s.day_of_week,
//         s.status,
//         r.route_number,
//         r.start_location,
//         r.end_location,
//         b.bus_number,
//         u.name as driver_name,
//         s.created_at
//       FROM schedules s
//       INNER JOIN routes r ON s.route_id = r.id
//       INNER JOIN buses b ON s.bus_id = b.id
//       INNER JOIN users u ON s.driver_id = u.id
//       WHERE s.driver_id = $1
//       ORDER BY s.created_at DESC
//       LIMIT $2 OFFSET $3
//     `;
    
//     const countQuery = 'SELECT COUNT(*) FROM schedules WHERE driver_id = $1';
    
//     const [schedulesResult, countResult] = await Promise.all([
//       client.query(query, [driverId, limit, offset]),
//       client.query(countQuery, [driverId])
//     ]);
    
//     res.json({
//       success: true,
//       schedules: schedulesResult.rows,
//       total: parseInt(countResult.rows[0].count),
//       page: parseInt(page),
//       totalPages: Math.ceil(countResult.rows[0].count / limit)
//     });
//   } catch (error) {
//     console.error('Error fetching driver history:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching history'
//     });
//   }
// };

// Start a trip (update schedule status)
const startTrip = async (req, res) => {
  try {
    const { driverId, scheduleId } = req.params;
    const tripDate = new Date().toISOString().split('T')[0]; // Current date YYYY-MM-DD
    const currentTime = new Date().toTimeString().split(' ')[0]; // Current time HH:MM:SS

    // Check if there's already an IN_PROGRESS trip for today
    const checkQuery = `
      SELECT id FROM trips 
      WHERE schedule_id = $1 
        AND driver_id = $2 
        AND trip_date = $3 
        AND status = 'IN_PROGRESS'
    `;
    
    const existingTrip = await client.query(checkQuery, [scheduleId, driverId, tripDate]);

    let result;
    
    if (existingTrip.rows.length > 0) {
      // If there's already an active trip for today, update it
      const updateQuery = `
        UPDATE trips 
        SET actual_start_time = $1
        WHERE id = $2
        RETURNING *
      `;
      
      result = await client.query(updateQuery, [currentTime, existingTrip.rows[0].id]);
    } else {
      // Create new trip record for today
      const insertQuery = `
        INSERT INTO trips (schedule_id, driver_id, trip_date, actual_start_time, status)
        SELECT $1, $2, $3, $4, 'IN_PROGRESS'
        FROM schedules s
        WHERE s.id = $1 AND s.driver_id = $2 AND s.status = 'ACTIVE'
        RETURNING *
      `;
      
      result = await client.query(insertQuery, [scheduleId, driverId, tripDate, currentTime]);
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found or you are not authorized to start this trip'
      });
    }

    res.json({
      success: true,
      trip: result.rows[0],
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
// End Trip Endpoint
const endTrip = async (req, res) => {
  try {
    const { driverId, scheduleId } = req.params;
    const tripDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];

    const query = `
      UPDATE trips 
      SET status = 'COMPLETED', 
          actual_end_time = $1
      WHERE schedule_id = $2 
        AND driver_id = $3 
        AND trip_date = $4
        AND status = 'IN_PROGRESS'
      RETURNING *
    `;
    
    const result = await client.query(query, [currentTime, scheduleId, driverId, tripDate]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Active trip not found'
      });
    }

    res.json({
      success: true,
      trip: result.rows[0],
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

// Get Today's Active Trip
const getActiveTrip = async (req, res) => {
  try {
    const { driverId, scheduleId } = req.params;
    const tripDate = new Date().toISOString().split('T')[0];

    const query = `
      SELECT t.*, 
             s.departure_time as scheduled_departure,
             s.arrival_time as scheduled_arrival,
             r.route_number,
             r.start_location,
             r.end_location,
             b.bus_number,
             b.bus_type
      FROM trips t
      INNER JOIN schedules s ON t.schedule_id = s.id
      INNER JOIN routes r ON s.route_id = r.id
      INNER JOIN buses b ON s.bus_id = b.id
      WHERE t.schedule_id = $1 
        AND t.driver_id = $2 
        AND t.trip_date = $3
        AND t.status = 'IN_PROGRESS'
    `;
    
    const result = await client.query(query, [scheduleId, driverId, tripDate]);

    res.json({
      success: true,
      trip: result.rows[0] || null,
      hasActiveTrip: result.rows.length > 0
    });
  } catch (error) {
    console.error('Error fetching active trip:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active trip'
    });
  }
};

// Get Trip History for Driver
const getTripHistory = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { days = 30 } = req.query; // Default to last 30 days

    const query = `
      SELECT t.*, 
             s.departure_time as scheduled_departure,
             s.arrival_time as scheduled_arrival,
             r.id,
             r.start_location,
             r.end_location,
             b.bus_number,
             b.bus_type
      FROM trips t
      INNER JOIN schedules s ON t.schedule_id = s.id
      INNER JOIN routes r ON s.route_id = r.id
      INNER JOIN buses b ON s.bus_id = b.id
      WHERE t.driver_id = $1 
        AND t.trip_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY t.trip_date DESC, t.actual_start_time DESC
    `;
    
    const result = await client.query(query, [driverId]);

    res.json({
      success: true,
      trips: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching trip history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trip history'
    });
  }
};

module.exports = {
  getDriversSchedule,
  getTripHistory,
  startTrip,
  endTrip,
  getActiveTrip
};