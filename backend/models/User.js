import mysqlConnection from '../config/database';

import bcrypt from 'bcrypt';


const CreateUser = async (req, res) => {
  try {
    // Extract fields from request body
    const { name, username, email, password } = req.body;

    // Basic validation
    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, username, email, password) are required',
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Build the INSERT query
    const insertQuery = `
      INSERT INTO users (name, username, email, password, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW());
    `;

    const insertParams = [name, username, email, hashedPassword];

    // Execute the INSERT query
    const results = await new Promise((resolve, reject) => {
      mysqlConnection.query(insertQuery, insertParams, (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results);
      });
    });

    res.status(201).json({ 
      success: true, 
      message: "User created successfully", 
      userId: results.insertId 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle duplicate entry errors
    if (error.code === 'ER_DUP_ENTRY') {
      const field = error.message.includes('email') ? 'email' : 'username';
      return res.status(409).json({ 
        success: false, 
        message: `${field} already exists` 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
};
