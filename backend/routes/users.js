const express = require('express');
const router = express.Router();

const getAllUsers = require('../controllers/user/getAllUsers');
const verifyAdmin = require('../controllers/user/verifyadmin');

router.get('/getAllUsers', getAllUsers);
router.put('/verify-admin/:id', verifyAdmin);
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