// db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.connect()
  .then(client => {
    console.log("✅ Connected to PostgreSQL");

    return client.query('SELECT NOW()')
      .then(res => {
        console.log("📅 Server time:", res.rows[0]);
        client.release();
      })
      .catch(err => {
        client.release();
        console.error("❌ Error running test query", err.stack);
      });
  })
  .catch(err => {
    console.error("❌ Failed to connect", err.stack);
  });

module.exports = pool;
