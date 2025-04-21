const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

// Get all customers for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    console.log("the request is:",req)
    const customers = await Customer.find({ userId: req.user._id });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new customer
router.post('/', auth, async (req, res) => {
  try {
    const customer = new Customer({
      name: req.body.name,
      userId: req.user._id
    });
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Customer already exists' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Delete a customer
router.delete('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 