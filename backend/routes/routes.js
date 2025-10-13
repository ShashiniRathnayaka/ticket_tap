const express = require('express');
const router = express.Router();
const { addRoute, getAllRoutes, getRouteById, updateRoute, deleteRoute } = require('../controllers/routeController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/getAllRoutes', getAllRoutes);

// Add JSON middleware for this router
router.use(express.json());
router.use(authenticateToken);

router.post('/add-route', addRoute);

router.get('/getRoute/:id', getRouteById);
router.put('/updateRoute/:id', updateRoute);
router.delete('/deleteRoute/:id', deleteRoute);

module.exports = router;