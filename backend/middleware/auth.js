const jwt = require('jsonwebtoken');
const mysqlConnection = require('../config/database.js');
const dotenv = require('dotenv');

dotenv.config();

const auth = async (req, res, next) => {
  // console.log('Auth middleware - Request path:', req);

  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({
        error: 'No Authorization header found',
        message: 'Please provide an authentication token'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        error: 'Invalid token format',
        message: 'Authentication token is missing or malformed'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    // Directly use the pool-based query method
    const [users] = await mysqlConnection.query(
      'SELECT * FROM users WHERE id = ?',
      [decoded.id]
    );
    // console.log("the  user is:",users?.length)
    if (!users) {
      return res.status(401).json({
        error: 'User not found',
        message: 'The user associated with this token no longer exists'
      });
    }

    const user = { ...users };
    delete user.password;

    req.token = token;
    req.user = user;
    console.log('Auth successful for user:', user.username);
    next();
  } catch (error) {
    console.error('Authentication error:', error);

    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please login again.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Malformed authentication token'
      });
    }

    // Handle MySQL connection errors
    if (error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection error:', error);
      return res.status(503).json({
        error: 'Database connection error',
        message: 'Failed to connect to the database'
      });
    }

    // Important: Add return to prevent headers sent error
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'An error occurred during authentication'
    });
  }
};

module.exports = auth;