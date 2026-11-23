const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const cookieParser = require('cookie-parser');

const authRoute = require('./routes/AdminAuthRoute');
const usersRoute = require('./routes/AdminUsersRoute');

const app = express();
const PORT = process.env.ADMIN_PORT || 8081;

// Middleware
// Allow multiple admin frontend dev origins with credentials
const adminAllowedOrigins = [
  process.env.ADMIN_FRONTEND_ORIGIN,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
].filter(Boolean);

const adminCorsOptions = {
  credentials: true,
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (adminAllowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
};

app.use(cors(adminCorsOptions));
app.options('/*any', cors(adminCorsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to Bloomfolio Admin API');
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Admin server is running' });
});

// Routes
app.use('/admin/auth', authRoute);
app.use('/admin', usersRoute);
app.use('/admin', require('./routes/AdminRequestsRoute'));
app.use('/admin', require('./routes/AdminOrdersRoute'));
app.use('/admin', require('./routes/AdminBulkRoute'));

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bloomfolio';
    await mongoose.connect(mongoURI);
    console.log('Admin MongoDB connected successfully');
  } catch (error) {
    console.error('Admin MongoDB connection error:', error);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`Admin server is running on port ${PORT}`);
});

module.exports = app;