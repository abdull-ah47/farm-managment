const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const auth = async (req, res, next) => {
  console.log('Auth middleware - Request path:', req.path);
  
  try {
    // Extract token from header
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
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return res.status(401).json({
        error: 'Invalid token',
        message: jwtError.name === 'TokenExpiredError' 
          ? 'Your session has expired. Please login again.'
          : 'Invalid authentication token'
      });
    }

    // Find user using MySQL
    const connection = await pool.getConnection();
    try {
      const [users] = await connection.query(
        'SELECT * FROM users WHERE id = ?',
        [decoded.id]
      );
      
      if (!users || users.length === 0) {
        return res.status(401).json({
          error: 'User not found',
          message: 'The user associated with this token no longer exists'
        });
      }

      const user = users[0];
      // Remove sensitive data
      delete user.password;

      // Attach user and token to request
      req.token = token;
      req.user = user;
      console.log('Auth successful for user:', user.username);
      next();
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'An error occurred during authentication'
    });
  }
};

module.exports = auth; 