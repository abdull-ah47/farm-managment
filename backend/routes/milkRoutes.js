const express = require('express');
const MilkEntry = require('../models/MilkEntry'); 

const router = express.Router();

// POST route to save milk data
router.post('/milkentries', async (req, res) => {
  try {
    // Destructure the incoming request body
    const { date, customerName, milkType, milkAmount, rate, cashReceived, creditDue } = req.body;

    // Create a new instance of MilkEntry, depending on the milk type
    const newMilkEntry = new MilkEntry({
      date,
      customerName,
      milkType,         // 'morning' or 'evening'
      milkAmount,       // Store the amount for the selected milk type
      rate,
      cashReceived,
      creditDue,
    });

    // Save the entry to the database
    await newMilkEntry.save();

    // Send a success response
    res.status(201).json({ message: 'Milk entry added successfully!' });
  } catch (error) {
    console.error('Error adding milk entry:', error);
    res.status(500).json({ message: 'Failed to add milk entry. Please try again.' });
  }
});

// GET route to fetch milk entries
router.get('/milkentries', async (req, res) => {
  try {
    const milkEntries = await MilkEntry.find();
    res.status(200).json(milkEntries);
  } catch (error) {
    console.error('Error fetching milk entries:', error);
    res.status(500).json({ message: 'Failed to fetch milk entries. Please try again.' });
  }
});

module.exports = router;
