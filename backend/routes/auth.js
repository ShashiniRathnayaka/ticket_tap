const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');

// // Add JSON middleware for this router
// router.use(express.json());
// router.use(authenticateToken);

router.post('/admin-signup', authController.adminSignup);
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post("/change-password", authenticateToken, authController.changePassword);

module.exports = router;