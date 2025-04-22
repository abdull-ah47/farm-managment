const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Register new user
router.post('/register', async (req, res) => {
  const pool = req.app.get('db');
  const connection = await pool.getConnection();
  
  try {
    console.log('Registration request received:', req.body);
    const { username, email, password, name } = req.body;

    // Validate input
    if (!username || !email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const [existingUsers] = await connection.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email.toLowerCase(), username.toLowerCase()]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await connection.query(
      `INSERT INTO users (username, email, password, name, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [username.toLowerCase(), email.toLowerCase(), hashedPassword, name]
    );

    // Get the inserted user
    const [newUser] = await connection.query(
      'SELECT id, name, username, email FROM users WHERE id = ?',
      [result.insertId]
    );

    // Create JWT token
    const token = jwt.sign(
      { id: result.insertId, username: username.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('User registered successfully:', newUser[0]);

    res.status(201).json({
      message: 'Registration successful',
      user: newUser[0],
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  } finally {
    connection.release();
  }
});

// Login user
router.post('/login', async (req, res) => {
  const pool = req.app.get('db');
  const connection = await pool.getConnection();
  
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user
    const [users] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    const user = users[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    delete user.password;

    res.json({
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed: ' + error.message });
  } finally {
    connection.release();
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