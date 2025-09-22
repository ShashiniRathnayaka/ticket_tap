const express = require('express');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Get driver's assigned schedules
router.get('/:driverId/schedules', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;
    
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
        b.capacity,
        u.name as driver_name
      FROM schedules s
      INNER JOIN routes r ON s.route_id = r.id
      INNER JOIN buses b ON s.bus_id = b.id
      INNER JOIN users u ON s.driver_id = u.id
      WHERE s.driver_id = $1 AND s.status = 'ACTIVE'
      ORDER BY s.departure_time
    `;
    
    const result = await pool.query(query, [driverId]);
    
    res.json({
      success: true,
      schedules: result.rows
    });
  } catch (error) {
    console.error('Error fetching driver schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching schedules'
    });
  }
});

// Get driver's schedule history
router.get('/:driverId/history', authenticateToken, async (req, res) => {
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
      pool.query(query, [driverId, limit, offset]),
      pool.query(countQuery, [driverId])
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
});

// Start a trip (update schedule status)
router.patch('/:driverId/schedules/:scheduleId/start', authenticateToken, async (req, res) => {
  try {
    const { driverId, scheduleId } = req.params;
    
    const query = `
      UPDATE schedules 
      SET status = 'IN_PROGRESS', 
          started_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND driver_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [scheduleId, driverId]);
    
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
});

// End a trip
router.patch('/:driverId/schedules/:scheduleId/end', authenticateToken, async (req, res) => {
  try {
    const { driverId, scheduleId } = req.params;
    
    const query = `
      UPDATE schedules 
      SET status = 'COMPLETED', 
          ended_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND driver_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [scheduleId, driverId]);
    
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
});

module.exports = router;