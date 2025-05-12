const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const userRoutes = require('./routes/user');
const milkRoutes = require('./routes/milk');
const customerRoutes = require('./routes/customers');
require('dotenv').config();

const app = express();


// Enhanced CORS configuration
const corsOptions = {
  origin: [
     'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization', 'X-New-Token'],
  credentials: true,
  maxAge: 86400, // 24 hours

};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Explicit preflight handling

// Enhanced body parsing
app.use(express.json());




// Route configuration
app.use('/api/user', userRoutes);
app.use('/api/milk', milkRoutes);
app.use('/api/customers', customerRoutes);

// Health check endpoint




// Server startup
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
  Server running in ${process.env.NODE_ENV || 'development'} mode
Listening on port ${PORT}
  Base URL: http://localhost:${PORT}
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  server.close(() => process.exit(1));
});