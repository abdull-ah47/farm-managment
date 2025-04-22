// db.js
const mysql = require('mysql2');

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST, // Replace with your MySQL server host
  user: process.env.DB_USER,      // Replace with your MySQL username
  password: process.env.DB_PASSWORD, // Replace with your MySQL password
  database: process.env.DB_NAME,  // Replace with your MySQL database name
  waitForConnections: true,  // Allow connection pooling
  connectionLimit: 10,       // Max number of connections
  queueLimit: 0              // No limit on queued connections
});

// Export the pool to be used in other files
module.exports = pool.promise();
