const express = require('express');
const router = express.Router();
const mysqlConnection = require('../config/database');

// POST route to save milk data
router.post('/milkentries', async (req, res) => {
  try {
    // Destructure the incoming request body
    const { date, customerName, milkType, milkAmount, rate, cashReceived, creditDue } = req.body;

    // Validate required fields
    if (!date || !customerName || !milkType || !milkAmount || !rate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields (date, customerName, milkType, milkAmount, rate)'
      });
    }

    // Build the INSERT query
    const insertQuery = `
      INSERT INTO milk_entries 
      (date, customer_name, milk_type, milk_amount, rate, cash_received, credit_due, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const insertParams = [
      date,
      customerName,
      milkType,
      milkAmount,
      rate,
      cashReceived || 0,  // Default to 0 if not provided
      creditDue || 0      // Default to 0 if not provided
    ];

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
      message: 'Milk entry added successfully!',
      entryId: results.insertId
    });
  } catch (error) {
    console.error('Error adding milk entry:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to add milk entry. Please try again.',
      error: error.message
    });
  }
});

// GET route to fetch milk entries
router.get('/milkentries', async (req, res) => {
  try {
    const query = 'SELECT * FROM milk_entries ORDER BY date DESC';
    
    const entries = await new Promise((resolve, reject) => {
      mysqlConnection.query(query, (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results);
      });
    });

    res.status(200).json({
      success: true,
      data: entries
    });
  } catch (error) {
    console.error('Error fetching milk entries:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch milk entries. Please try again.',
      error: error.message
    });
  }
});

module.exports = router;