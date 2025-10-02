const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes and middleware
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

// Middleware
app.use(cors());
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

module.exports = app;