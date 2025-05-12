const mysql = require('mysql2');
require('dotenv').config();

// Enhanced connection pool configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 15, 
  queueLimit: 50,
  multipleStatements: false, 
  enableKeepAlive: true
});

// Enhanced connection test
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1); 
  } else {
    console.log('✅ Connected to database:', process.env.DB_NAME);
    connection.ping(err => {
      connection.release();
      if (err) console.error('⚠️ Database ping failed:', err.message);
      else console.log('Database ping successful');
    });
  }
});

// Promise wrapper with better error handling
const mysqlConnection = {
  query: async (sql, values) => {
    try {
      const [rows] = await pool.promise().query(sql, values);
      return rows;
    } catch (error) {
      console.error('Database query error:', error.message);
      throw new Error('Database operation failed');
    }
  },
  getConnection: async () => {
    try {
      return await pool.promise().getConnection();
    } catch (error) {
      console.error('Database connection error:', error.message);
      throw new Error('Database connection unavailable');
    }
  }
};

module.exports = mysqlConnection;