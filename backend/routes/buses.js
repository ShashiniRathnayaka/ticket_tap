const express = require('express');
const router = express.Router();
const { addBus, getAllBuses, getBusById, updateBus, deleteBus, getMyBuses } = require('../controllers/busController');

// Add authentication middleware to all routes
const authenticateToken = require('../middleware/authMiddleware');
router.use(authenticateToken);

// Add new bus
router.post('/add-bus', addBus);
router.get('/getAllBuses', getAllBuses);
router.get('/getBus/:id', getBusById);
router.put('/updateBus/:id', updateBus);
router.delete('/deleteBus/:id', deleteBus);
router.get('/getMyBuses', getMyBuses);

module.exports = router;