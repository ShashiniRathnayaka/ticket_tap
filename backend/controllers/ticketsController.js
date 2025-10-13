const client = require('../db');

// Get tickets for a specific user with pagination (latest first)
const getTicketsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT * FROM tickets
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const ticketsResult = await client.query(query, [userId, limit, offset]);

    const countResult = await client.query(
      'SELECT COUNT(*) FROM tickets WHERE user_id = $1',
      [userId]
    );

    const total = parseInt(countResult.rows[0].count);

    res.status(200).json({
      success: true,
      data: ticketsResult.rows,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching ticket history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getTicketsByUser };
