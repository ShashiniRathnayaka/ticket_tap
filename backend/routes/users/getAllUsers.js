const express = require('express');
const client = require('../../db');
const router = express.Router();

// Get all users (no authentication/authorization required)
router.get('/getAllUsers', async (req, res) => {
    console.log("getAllUsers called");
  try {
    // Query to get all users, excluding sensitive information like password_hash and refresh_token
    const result = await client.query(`
      SELECT * 
      FROM users 
    `);

    res.status(200).json({
      message: 'Users retrieved successfully',
      users: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving users' });
  }
});

module.exports = router;