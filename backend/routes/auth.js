const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const client = require('../db');
const router = express.Router();

function generateAccessToken(userId, role) {
  return jwt.sign({ userId, role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(userId, role) {
  return jwt.sign({ userId, role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

// Signup Route
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if email already exists
    const emailCheck = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    // Validate role (only allow certain self-registrations)
    if (role === 'DRIVER') {
      return res.status(403).json({ message: 'Drivers cannot self-register. Contact your admin.' });
    }

    let status = 'ACTIVE';
    if (role === 'ADMIN') {
      status = 'PENDING'; // needs SUPER_ADMIN approval
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await client.query(
      `INSERT INTO users (name, email, password_hash, role, status) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, email, hashedPassword, role, status]
    );

    const user = result.rows[0];

    // For admins → don’t give tokens yet
    if (role === 'ADMIN' && status === 'PENDING') {
      return res.status(201).json({ message: 'Admin account created. Waiting for approval.' });
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);

    await client.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

    res.status(201).json({
      message: 'User created',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ message: 'User not found' });

    const user = result.rows[0];

    // check status
    if (user.role === 'ADMIN' && user.status === 'PENDING') {
      return res.status(403).json({ message: 'Your account is pending approval.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);

    await client.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error logging in' });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.sendStatus(401); // Unauthorized if no token
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden if token invalid/expired
    }
    req.user = user; // attach decoded user { userId, role } to request
    next();
  });
}


// Only admins/super_admins can access
router.post('/add-driver', authenticateToken, async (req, res) => {
  const { name, email, password } = req.body;

  // Check role
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    // Check if email already exists
    const emailCheck = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await client.query(
      `INSERT INTO users (name, email, password_hash, role, status) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, status`,
      [name, email, hashedPassword, 'DRIVER', 'ACTIVE']
    );

    res.status(201).json({
      message: 'Driver added successfully',
      driver: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding driver' });
  }
});

module.exports = router;