const express = require('express');
const router = express.Router();
const { addSchedule, getAllSchedules, updateSchedule, deleteSchedule } = require('../controllers/scheduleController');
const authenticateToken = require('../middleware/authMiddleware');

// Add JSON middleware for this router
router.use(express.json());
router.use(authenticateToken);

router.post('/add-schedule', addSchedule);
router.get('/getAllSchedules', getAllSchedules);
router.put('/updateSchedule/:id', updateSchedule);
router.delete('/deleteSchedule/:id', deleteSchedule);

module.exports = router;