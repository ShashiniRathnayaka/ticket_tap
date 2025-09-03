const client = require('../../db');
const jwt = require('jsonwebtoken');

// Function to generate refresh token (same as in authcontroller)
function generateRefreshToken(userId, role) {
  return jwt.sign({ userId, role }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
}

// PUT /users/verify-admin/:id
const verifyAdmin = async (req, res) => {
    console.log("verify admin called with ID:", req.params.id);
    try {
        const userId = req.params.id;

        // First, check if user exists
        const userQuery = `
            SELECT id, role, status 
            FROM users 
            WHERE id = $1
        `;
        const userResult = await client.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userResult.rows[0];

        // Check if user is an admin
        if (user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'User is not an admin' });
        }

        // Generate refresh token
        const refreshToken = generateRefreshToken(userId, user.role);

        // Update user status to active and store refresh token
        const updateQuery = `
            UPDATE users 
            SET status = 'ACTIVE', refresh_token = $2
            WHERE id = $1 
            RETURNING *
        `;
        const updateResult = await client.query(updateQuery, [userId, refreshToken]);

        console.log("Admin verified successfully:", updateResult.rows[0]);
        
        res.json({ 
            message: 'Admin verified and status updated to active', 
            user: updateResult.rows[0],
            refreshToken: refreshToken // Optional: send back the refresh token
        });
    } catch (error) {
        console.error('Error verifying admin:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = verifyAdmin;