const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const cookieParser = require("cookie-parser");
const authRoute = require("./routes/AuthRoute");

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes and middleware
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

// Middleware
const FRONTEND_ORIGIN = 'http://localhost:5173';
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
// Handle preflight requests (Express 5 requires named wildcard)
app.options('/*any', cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to Bloomfolio API');
  // res.json({ message: 'Welcome to Bloomfolio API' });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});




// API routes
app.use('/api', routes);



// Error handling middleware
app.use(errorHandler);

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bloomfolio';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get('/fetch-details/:tradingCode', async (req, res) => {
  try {
    const { tradingCode } = req.params;
    
    // Import Stock model
    const Stock = require('./models/Stock');
    
    // Find stock by trading code
    const stock = await Stock.findOne({ tradingCode: tradingCode });
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `Stock with trading code '${tradingCode}' not found`
      });
    }
    
    // Send stock details as response
    res.json({
      success: true,
      data: stock
    });
    
  } catch (error) {
    console.error('Error fetching stock details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching stock details'
    });
  }
});

// Fetch all stocks endpoint
app.get('/fetch-all-stocks', async (req, res) => {
  try {
    // Import Stock model
    const Stock = require('./models/Stock');
    
    // Find all stocks
    const stocks = await Stock.find({});
    
    if (!stocks || stocks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No stocks found in the database'
      });
    }
    
    // Send all stocks as response
    res.json({
      success: true,
      data: stocks,
      count: stocks.length
    });
    
  } catch (error) {
    console.error('Error fetching all stocks:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching all stocks'
    });
  }
});
app.use("/", authRoute);

module.exports = app;