const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const client = require("../db");

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

// Admin-specific signup endpoint
exports.adminSignup = async (req, res) => {
  const { 
    name, 
    email, 
    password, 
    nic, 
    mobileNumber,
    companyName, 
    businessRegNumber, 
    depotName, 
    location 
  } = req.body;
console.log("admin signup called");
  try {
    // Check if email already exists
    const emailCheck = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const status = "PENDING"; // Needs SUPER_ADMIN approval

    // Insert the admin user with additional fields
    const result = await client.query(
      `INSERT INTO users (
        name, email, password_hash, role, status, nic, mobile_number,
        company_name, business_reg_number, depot_name, location
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING id, name, email, role, status, nic, mobile_number, 
                 company_name, business_reg_number, depot_name, location`,
      [
        name, email, hashedPassword, "ADMIN", status, nic, mobileNumber,
        companyName, businessRegNumber, depotName, location
      ]
    );

    const user = result.rows[0];

    res.status(201).json({
      message: "Admin account created successfully. Waiting for approval from Super Admin.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        nic: user.nic,
        mobileNumber: user.mobile_number,
        companyName: user.company_name,
        businessRegNumber: user.business_reg_number,
        depotName: user.depot_name,
        location: user.location
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating admin account" });
  }
};

exports.signup = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if email already exists
    const emailCheck = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    // Validate role (only allow certain self-registrations)
    if (role === "DRIVER") {
      return res
        .status(403)
        .json({ message: "Drivers cannot self-register. Contact your admin." });
    }

    let status = "ACTIVE";
    if (role === "ADMIN") {
      status = "PENDING"; // needs SUPER_ADMIN approval
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await client.query(
      `INSERT INTO users (name, email, password_hash, role, status) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, email, hashedPassword, role, status]
    );

    const user = result.rows[0];

    // For admins → don’t give tokens yet
    if (role === "ADMIN" && status === "PENDING") {
      return res
        .status(201)
        .json({ message: "Admin account created. Waiting for approval." });
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);

    await client.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [
      refreshToken,
      user.id,
    ]);

    res.status(201).json({
      message: "User created",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating user" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await client.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0)
      return res.status(400).json({ message: "User not found" });

    const user = result.rows[0];

    // check status
    if (user.role === "ADMIN" && user.status === "PENDING") {
      return res
        .status(403)
        .json({ message: "Your account is pending approval." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);

    await client.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [
      refreshToken,
      user.id,
    ]);

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error logging in" });
  }
};

exports.authenticateToken = (req, res, next) => {
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
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId; // From authenticated token

  // Validation
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ 
      message: "Current password and new password are required" 
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ 
      message: "New password must be at least 6 characters long" 
    });
  }

  try {
    // Get user from database
    const userResult = await client.query(
      "SELECT * FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword, 
      user.password_hash
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await client.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [hashedNewPassword, userId]
    );

    res.status(200).json({ 
      message: "Password changed successfully" 
    });

  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ message: "Error changing password" });
  }
};