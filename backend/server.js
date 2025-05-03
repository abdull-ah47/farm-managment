const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const userRoutes = require('./routes/user');
const milkRoutes = require('./routes/milk');
const customerRoutes = require('./routes/customers');
require('dotenv').config();

const app = express();

// Create MySQL connection pool with better error handling
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,
  ssl: {
    rejectUnauthorized: false
  }
});

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

// Make pool available in routes
app.set('db', pool);

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
const tryStartServer = (port) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(port)
      .once('listening', () => {
        console.log(`Server is running on port ${port}`);
        console.log(`API URL: http://localhost:${port}`);
        resolve(server);
      })
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} is in use, will try next port`);
          server.close();
          resolve(false);
        } else {
          reject(err);
        }
      });
  });
};

// Start server with port fallback
const startServer = async () => {
  try {
    console.log('Attempting to connect to database...');
    console.log('Database config:', {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    const connection = await pool.getConnection();
    console.log('Database connection established successfully.');

    const [result] = await connection.query('SELECT 1 as test');
    console.log('Database query test successful:', result);

    connection.release();

    // Use process.env.PORT for hosting providers
    const port = process.env.PORT || 8080;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    console.error('Error details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    process.exit(1);
  }
};

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed.');
  }
  if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('Database has too many connections.');
  }
  if (err.code === 'ECONNREFUSED') {
    console.error('Database connection was refused.');
  }
});

startServer();
