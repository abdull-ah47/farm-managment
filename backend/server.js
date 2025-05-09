const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const userRoutes = require('./routes/user');
const milkRoutes = require('./routes/milk');
const customerRoutes = require('./routes/customers');
require('dotenv').config();

const app = express();


// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});


// Routes
app.use('/api/user', userRoutes);
app.use('/api/milk', milkRoutes);
app.use('/api/customers', customerRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Function to try starting server on different ports
app.listen(process.env.PORT || 5000, ()=>{
  console.log("the port is listning on:",process.env.PORT)
})




