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
// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
  console.log("the email and password are:",email,password)
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }

    // Get user from database
    const [users] = await mysqlConnection.query(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    // Check if user exists
    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

  const user = users; // Get the first matching user

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }
    // JWT token generation
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role // Add if you have roles
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create safe user object without password
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      created_at: user.created_at
      // Add other public fields as needed
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userResponse,
      token
    });
    // ... rest of the login logic ...

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
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