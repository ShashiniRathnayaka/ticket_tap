const express = require('express');
const router = express.Router();
const { getDriversSchedule, getActiveTrip, startTrip, endTrip, getTripHistory } = require('../controllers/user/drivers');

// Add authentication middleware to all routes
const authenticateToken = require('../middleware/authMiddleware');
router.use(authenticateToken);

router.get('/schedules', getDriversSchedule);
// Add these routes to your Express app
router.post('/start/:driverId/:scheduleId', startTrip);
router.post('/end/:driverId/:scheduleId', endTrip);
router.get('/active/:driverId/:scheduleId', getActiveTrip);
router.get('/history/:driverId', getTripHistory);

module.exports = router;