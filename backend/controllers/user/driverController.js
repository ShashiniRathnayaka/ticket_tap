const client = require('../../db');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");

function generateAccessToken(userId, role) {
  return jwt.sign({ userId, role }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
}

function generateRefreshToken(userId, role) {
  return jwt.sign({ userId, role }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
}

// const addDriver = async (req, res) => {
//   const { 
//     name, 
//     email, 
//     password, 
//     nic, 
//     driving_licence_number, 
//     experience_years, 
//     mobile_number 
//   } = req.body;

//   try {
//     // Check if email already exists
//     const emailCheck = await client.query('SELECT * FROM users WHERE email = $1', [email]);
//     if (emailCheck.rows.length > 0) {
//       return res.status(409).json({ message: 'Email is already registered' });
//     }

//     // Check if NIC already exists
//     const nicCheck = await client.query('SELECT * FROM users WHERE nic = $1', [nic]);
//     if (nicCheck.rows.length > 0) {
//       return res.status(409).json({ message: 'NIC is already registered' });
//     }

//     // Check if driving licence number already exists
//     const licenceCheck = await client.query('SELECT * FROM users WHERE driving_licence_number = $1', [driving_licence_number]);
//     if (licenceCheck.rows.length > 0) {
//       return res.status(409).json({ message: 'Driving licence number is already registered' });
//     }

//     // Check if mobile number already exists
//     const mobileCheck = await client.query('SELECT * FROM users WHERE mobile_number = $1', [mobile_number]);
//     if (mobileCheck.rows.length > 0) {
//       return res.status(409).json({ message: 'Mobile number is already registered' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const result = await client.query(
//       `INSERT INTO users (
//         name, email, password_hash, role, status, nic, 
//         driving_licence_number, experience_years, mobile_number, added_by
//       ) 
//        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
//        RETURNING *`,
//       [
//         name, email, hashedPassword, 'DRIVER', 'ACTIVE', nic, 
//         driving_licence_number, experience_years, mobile_number
//       ]
//     );

//     const driver = result.rows[0];

//     // Generate tokens for the driver
//     const accessToken = generateAccessToken(driver.id, driver.role);
//     const refreshToken = generateRefreshToken(driver.id, driver.role);

//     // Store refresh token in database
//     await client.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [
//       refreshToken,
//       driver.id,
//     ]);

//     res.status(201).json({
//       message: 'Driver added successfully',
//       accessToken,
//       refreshToken,
//       driver: {
//         id: driver.id,
//         name: driver.name,
//         email: driver.email,
//         role: driver.role,
//         status: driver.status,
//         nic: driver.nic,
//         driving_licence_number: driver.driving_licence_number,
//         experience_years: driver.experience_years,
//         mobile_number: driver.mobile_number
//       }
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Error adding driver' });
//   }
// };

// const getAllDrivers = async (req, res) => {
//   try {
//     // Query to get all users with role 'DRIVER'
//     const result = await client.query(
//       `SELECT *
//        FROM users 
//        WHERE role = 'DRIVER' `
//     );

//     const drivers = result.rows;

//     res.status(200).json({
//       message: 'Drivers retrieved successfully',
//       count: drivers.length,
//       drivers: drivers
//     });
//   } catch (err) {
//     console.error('Error fetching drivers:', err);
//     res.status(500).json({ message: 'Error retrieving drivers' });
//   }
// };

const addDriver = async (req, res) => {
  // Debug: Check if user object exists
  console.log('Request user:', req.user);
  
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const { 
    name, 
    email, 
    password, 
    nic, 
    driving_licence_number, 
    experience_years, 
    mobile_number 
  } = req.body;

  // Get the admin ID from the authenticated user
  const added_by = req.user.userId;

  try {
    // Check if email already exists
    const emailCheck = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    // Check if NIC already exists
    const nicCheck = await client.query('SELECT * FROM users WHERE nic = $1', [nic]);
    if (nicCheck.rows.length > 0) {
      return res.status(409).json({ message: 'NIC is already registered' });
    }

    // Check if driving licence number already exists
    const licenceCheck = await client.query('SELECT * FROM users WHERE driving_licence_number = $1', [driving_licence_number]);
    if (licenceCheck.rows.length > 0) {
      return res.status(409).json({ message: 'Driving licence number is already registered' });
    }

    // Check if mobile number already exists
    const mobileCheck = await client.query('SELECT * FROM users WHERE mobile_number = $1', [mobile_number]);
    if (mobileCheck.rows.length > 0) {
      return res.status(409).json({ message: 'Mobile number is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await client.query(
      `INSERT INTO users (
        name, email, password_hash, role, status, nic, 
        driving_licence_number, experience_years, mobile_number, added_by
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        name, email, hashedPassword, 'DRIVER', 'ACTIVE', nic, 
        driving_licence_number, experience_years, mobile_number, added_by
      ]
    );

    const driver = result.rows[0];

    // Generate tokens for the driver
    const accessToken = generateAccessToken(driver.id, driver.role);
    const refreshToken = generateRefreshToken(driver.id, driver.role);

    // Store refresh token in database
    await client.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [
      refreshToken,
      driver.id,
    ]);

    res.status(201).json({
      message: 'Driver added successfully',
      accessToken,
      refreshToken,
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        role: driver.role,
        status: driver.status,
        nic: driver.nic,
        driving_licence_number: driver.driving_licence_number,
        experience_years: driver.experience_years,
        mobile_number: driver.mobile_number,
        added_by: driver.added_by
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding driver' });
  }
};

const getAllDrivers = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.user.userId;
    const userRole = req.user.role;

    let query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.status,
        u.nic,
        u.driving_licence_number,
        u.experience_years,
        u.mobile_number,
        u.added_by
      FROM users u
      WHERE u.role = 'DRIVER'
    `;
    
    let queryParams = [];

    // Regular admins can only see drivers they added
    if (userRole === 'ADMIN') {
      query += ' AND u.added_by = $1';
      queryParams.push(userId);
    }
    // Super admin can see all drivers
    else if (userRole === 'SUPER_ADMIN') {
      // No filter needed - can see all drivers
    }

    // Remove ORDER BY created_at since the field doesn't exist
    // You can order by another field if needed, e.g., name or id
    query += ' ORDER BY u.name';

    const result = await client.query(query, queryParams);
    const drivers = result.rows;

    res.status(200).json({
      message: 'Drivers retrieved successfully',
      count: drivers.length,
      drivers: drivers
    });
  } catch (err) {
    console.error('Error fetching drivers:', err);
    res.status(500).json({ message: 'Error retrieving drivers' });
  }
};

module.exports = {
  addDriver,
  getAllDrivers
};