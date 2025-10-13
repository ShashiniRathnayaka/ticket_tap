const express = require('express');
const { getTicketsByUser } = require('../controllers/ticketsController');

const router = express.Router();

// Example: GET /api/tickets/:userId?page=1&limit=10
router.get('/:userId', getTicketsByUser);

module.exports = router;
