const mysql = require('mysql2');

// Create a connection pool instead of a single connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Initial test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to the database');
    connection.release(); // Release after initial test
  }
});

// Export as mysqlConnection (same name you're using elsewhere)
const mysqlConnection = pool.promise();
module.exports = mysqlConnection;


// const { Sequelize } = require('sequelize');
// require('dotenv').config();
// const { Sequelize } = require('sequelize');
// require('dotenv').config({ path: '/home/u988281532/domains/chinartrader.com/public_html/api/.env' });

// // Verify environment variables are loaded
// console.log('DB_USER from env:', process.env.DB_USER);

// console.log('Database Config:', {
//   database: process.env.DB_NAME,
//   username: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT || 3306
// });

// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT || 3306,
//     dialect: 'mysql',
//     logging: (msg) => console.log(msg), // Enable SQL query logging
//     dialectOptions: {
//       connectTimeout: 60000,
//       multipleStatements: true,
//       supportBigNumbers: true,
//       bigNumberStrings: true
//     },
//     pool: {
//       max: 5,
//       min: 0,
//       acquire: 30000,
//       idle: 10000
//     },
//     define: {
//       charset: 'utf8mb4',
//       collate: 'utf8mb4_unicode_ci',
//       timestamps: true,
//       underscored: true
//     }
//   }
// );

// // Test database connection
// const testConnection = async () => {
//   try {
//     await sequelize.authenticate();
//     console.log('Database connection established successfully.');
    
//     // Sync all models
//     await sequelize.sync({ alter: true });
//     console.log('Database models synchronized successfully.');
//   } catch (error) {
//     console.error('Unable to connect to the database:', error);
//     process.exit(1);
//   }
// };

// testConnection();

// module.exports = sequelize; 