const express = require('express');
const router = express.Router();
const MilkEntry = require('../models/MilkEntry');
const auth = require('../middleware/auth');

// Add new milk entry
router.post('/', auth, async (req, res) => {
  try {
    const milkEntry = new MilkEntry({
      ...req.body,
      userId: req.user._id
    });
    await milkEntry.save();
    res.status(201).json(milkEntry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all milk entries for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, customerName, milkType } = req.query;
    const query = { userId: req.user._id };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (customerName) {
      query.customerName = customerName;
    }

    if (milkType) {
      query.milkType = milkType;
    }

    const entries = await MilkEntry.find(query).sort({ date: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get daily data
router.get('/daily-data', auth, async (req, res) => {
  try {
    const entries = await MilkEntry.find({
      userId: req.user._id
    }).sort({ date: -1 });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly data
router.get('/monthly-data', auth, async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const entries = await MilkEntry.find({
      userId: req.user._id,
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    }).sort({ date: 1 });

    // Calculate totals
    const totals = entries.reduce((acc, entry) => {
      acc.cashReceived += entry.cashReceived || 0;
      acc.creditDue += entry.creditDue || 0;
      acc.totalMilkSold += entry.liters || 0;
      return acc;
    }, { cashReceived: 0, creditDue: 0, totalMilkSold: 0 });

    // Prepare data for chart
    const dates = [];
    const cashReceived = [];
    const creditDue = [];
    const totalMilkSold = [];

    entries.forEach(entry => {
      const date = entry.date.toISOString().split('T')[0];
      if (!dates.includes(date)) {
        dates.push(date);
        cashReceived.push(0);
        creditDue.push(0);
        totalMilkSold.push(0);
      }

      const index = dates.indexOf(date);
      cashReceived[index] += entry.cashReceived || 0;
      creditDue[index] += entry.creditDue || 0;
      totalMilkSold[index] += entry.liters || 0;
    });

    res.json({
      ...totals,
      dates,
      cashReceived,
      creditDue,
      totalMilkSold
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update milk entry
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('Update request received for ID:', req.params.id);
    console.log('Update data:', req.body);

    // Validate required fields
    const { customerName, milkType, liters, rate, cashReceived, creditDue } = req.body;

    if (!customerName || !milkType || liters === undefined || rate === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate numeric values
    if (isNaN(liters) || liters <= 0) {
      return res.status(400).json({ error: 'Liters must be a positive number' });
    }
    if (isNaN(rate) || rate <= 0) {
      return res.status(400).json({ error: 'Rate must be a positive number' });
    }
    if (isNaN(cashReceived) || cashReceived < 0) {
      return res.status(400).json({ error: 'Cash received must be a non-negative number' });
    }
    if (isNaN(creditDue) || creditDue < 0) {
      return res.status(400).json({ error: 'Credit due must be a non-negative number' });
    }

    // Validate milk type
    if (!['morning', 'evening'].includes(milkType)) {
      return res.status(400).json({ error: 'Invalid milk type' });
    }

    const updates = Object.keys(req.body);
    const allowedUpdates = ['customerName', 'milkType', 'liters', 'rate', 'cashReceived', 'creditDue'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates!' });
    }

    const entry = await MilkEntry.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id
      },
      {
        customerName,
        milkType,
        liters: Number(liters),
        rate: Number(rate),
        cashReceived: Number(cashReceived),
        creditDue: Number(creditDue)
      },
      { new: true, runValidators: true }
    );

    if (!entry) {
      console.log('Entry not found');
      return res.status(404).json({ error: 'Entry not found' });
    }

    console.log('Entry updated successfully:', entry);
    res.json(entry);
  } catch (error) {
    console.error('Update error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete milk entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await MilkEntry.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 