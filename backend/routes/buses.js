const express = require('express');
const router = express.Router();
const { addBus, getAllBuses, getBusById, updateBus, deleteBus } = require('../controllers/busController');

// Add new bus
router.post('/add-bus', addBus);

// Get all buses
router.get('/getAllBuses', getAllBuses);

// Get bus by ID
router.get('/getBus/:id', getBusById);
router.put('/updateBus/:id', updateBus);
router.delete('/deleteBus/:id', deleteBus);

module.exports = router;