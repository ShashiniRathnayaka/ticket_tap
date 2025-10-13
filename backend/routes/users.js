const express = require('express');
const router = express.Router();

// Import the authentication middleware
const authenticateToken = require('../middleware/authMiddleware');

const getAllUsers = require('../controllers/user/getAllUsers');
const verifyAdmin = require('../controllers/user/verifyadmin');
const { addDriver, getAllDrivers } = require('../controllers/user/driverController');

router.get('/getAllUsers', getAllUsers);
router.put('/verify-admin/:id', verifyAdmin);

// Add authentication to these routes only
router.post('/add-driver', authenticateToken, addDriver);
router.get('/getAllDrivers', authenticateToken, getAllDrivers);

router.get('/test', (req, res) => {
    res.json({ message: 'Test route works!' });
});

// Debug: Print all registered routes
console.log('Registered user routes:');
router.stack.forEach((layer) => {
    if (layer.route) {
        console.log(`${Object.keys(layer.route.methods)[0].toUpperCase()} ${layer.route.path}`);
    }
});

module.exports = router;