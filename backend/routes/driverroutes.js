const express = require('express');
const router = express.Router();
const { getDriversSchedule, getScheduleHistory, startTrip, endTrip } = require('../controllers/user/drivers');

// Add authentication middleware to all routes
const authenticateToken = require('../middleware/authMiddleware');
router.use(authenticateToken);

router.get('/schedules', getDriversSchedule);

module.exports = router;