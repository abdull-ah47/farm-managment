const express = require('express');
const router = express.Router();
const mysqlConnection = require('../config/database');

// POST: Add milk entry
router.post('/milkentries', async (req, res) => {
  try {
    console.log("Request body:", req.body);
    
    const { date, customerName, milkType, milkAmount, rate, cashReceived, creditDue } = req.body;

    // Validate required fields
    if (!date || !customerName || !milkType || !milkAmount || !rate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields (date, customerName, milkType, milkAmount, rate)'
      });
    }

    const insertQuery = `
      INSERT INTO milk_entries 
      (date, customer_name, milk_type, milk_amount, rate, cash_received, credit_due, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await mysqlConnection.query(insertQuery, [
      date,
      customerName,
      milkType,
      milkAmount,
      rate,
      cashReceived || 0,
      creditDue || 0
    ]);

    res.status(201).json({
      success: true,
      message: 'Milk entry added successfully!',
      entryId: result.insertId || null
    });

  } catch (error) {
    console.error('Error adding milk entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add milk entry.',
      error: error.message
    });
  }
});

// GET: Fetch milk entries
router.get('/milkentries', async (req, res) => {
  try {
    const entries = await mysqlConnection.query(
      'SELECT * FROM milk_entries ORDER BY date DESC'
    );

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
