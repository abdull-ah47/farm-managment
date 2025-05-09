const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const mysqlConnection = require('../config/database');

// Register new user
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { username, email, password, name } = req.body;

    // Validate input
    if (!username || !email || !password || !name) {
      return res.status(400).json({ 
        success: false,
        error: 'All fields are required' 
      });
    }

    // Check if user exists
    const checkUserQuery = `
      SELECT * FROM users 
      WHERE email = ? OR username = ?
    `;
    const checkUserParams = [email.toLowerCase(), username.toLowerCase()];

    const existingUsers = await new Promise((resolve, reject) => {
      mysqlConnection.query(checkUserQuery, checkUserParams, (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results);
      });
    });

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'User with this email or username already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const insertUserQuery = `
      INSERT INTO users (username, email, password, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;
    const insertUserParams = [
      username.toLowerCase(), 
      email.toLowerCase(), 
      hashedPassword, 
      name
    ];

    const insertResult = await new Promise((resolve, reject) => {
      mysqlConnection.query(insertUserQuery, insertUserParams, (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results);
      });
    });

    // Get the inserted user
    const getUserQuery = `
      SELECT id, name, username, email 
      FROM users 
      WHERE id = ?
    `;
    const getUserParams = [insertResult.insertId];

    const [newUser] = await new Promise((resolve, reject) => {
      mysqlConnection.query(getUserQuery, getUserParams, (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results);
      });
    });

    // Create JWT token
    const token = jwt.sign(
      { id: insertResult.insertId, username: username.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('User registered successfully:', newUser);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: newUser,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Registration failed: ' + error.message 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("the email and password is:",email, password)
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }

    // Get user
    const getUserQuery = `
      SELECT * FROM users 
      WHERE email = ?
    `;
    const getUserParams = [email.toLowerCase()];

    console.time("LoginQuery");
const users = await new Promise((resolve, reject) => {
  mysqlConnection.query(getUserQuery, getUserParams, (error, results) => {
    if (error) return reject(error);
    resolve(results);
  });
});
console.timeEnd("LoginQuery");

    
    console.log("the password is:",users)
    if (!users) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Check password
    console.log("the originale and password is:",password, users[0].password)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Create token
    const token = jwt.sign(
      { id: users[0].id, username: users[0].username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Login failed: ' + error.message 
    });
  }
});

module.exports = router;



// const express = require('express');
// const router = express.Router();
// const jwt = require('jsonwebtoken');
// const { User } = require('../models/User');

// // Register new user
// router.post('/register', async (req, res) => {
//   try {
//     const { username, email, password } = req.body;

//     // Check if user already exists
//     const existingUser = await User.findOne({ where: { email } });
//     if (existingUser) {
//       return res.status(400).json({ error: 'User already exists' });
//     }

//     // Create new user
//     const user = await User.create({
//       username,
//       email,
//       password
//     });

//     // Generate token
//     const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

//     res.status(201).json({ user, token });
//   } catch (error) {
//     console.error('Registration error:', error);
//     res.status(400).json({ error: error.message });
//   }
// });

// // Login user
// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Find user
//     const user = await User.findOne({ where: { email } });
//     if (!user) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     // Check password
//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     // Generate token
//     const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

//     res.json({ user, token });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(400).json({ error: error.message });
//   }
// });

// module.exports = router; 