require('./db');

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const busesRoutes = require('./routes/buses');
const routesRoutes = require('./routes/routes');
const schedulesRoutes = require('./routes/schedules');

// Load environment variables from .env file
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // for parsing application/json

// Routes
app.use('/auth', authRoutes); // Add the authentication routes here
app.use('/users', usersRoutes);
app.use('/buses', busesRoutes);
app.use('/routes', routesRoutes);
app.use('/schedules', schedulesRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
