const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mysqlConnection = require('../config/database');

// Get all customers for the authenticated user
router.get('/', auth, (req, res) => {
    const query = 'SELECT * FROM customers WHERE user_id = ? ORDER BY name';
    mysqlConnection.query(query, [req.user.id], (err, results) => {
        if (err) {
            console.error('Error fetching customers:', err);
            return res.status(500).json({ error: 'Failed to fetch customers' });
        }
        res.json(results);
    });
});

// Add a new customer
router.post('/', auth, (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Customer name is required' });
    }

    const checkQuery = 'SELECT * FROM customers WHERE name = ? AND user_id = ?';
    mysqlConnection.query(checkQuery, [name, req.user.id], (err, existing) => {
        if (err) {
            console.error('Error checking existing customer:', err);
            return res.status(500).json({ error: 'Failed to add customer' });
        }

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Customer already exists' });
        }

        const insertQuery = 'INSERT INTO customers (name, user_id) VALUES (?, ?)';
        mysqlConnection.query(insertQuery, [name, req.user.id], (err, result) => {
            if (err) {
                console.error('Error inserting customer:', err);
                return res.status(500).json({ error: 'Failed to add customer' });
            }

            const newCustomer = {
                id: result.insertId,
                name,
                user_id: req.user.id
            };
            res.status(201).json({ ...newCustomer, message: 'Customer added successfully' });
        });
    });
});

// Update customer
router.put('/:id', auth, (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Customer name is required' });
    }

    const checkQuery = 'SELECT * FROM customers WHERE name = ? AND user_id = ? AND id != ?';
    mysqlConnection.query(checkQuery, [name, req.user.id, req.params.id], (err, existing) => {
        if (err) {
            console.error('Error checking customer:', err);
            return res.status(500).json({ error: 'Failed to update customer' });
        }

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Customer name already exists' });
        }

        const updateQuery = 'UPDATE customers SET name = ? WHERE id = ? AND user_id = ?';
        mysqlConnection.query(updateQuery, [name, req.params.id, req.user.id], (err, result) => {
            if (err) {
                console.error('Error updating customer:', err);
                return res.status(500).json({ error: 'Failed to update customer' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Customer not found' });
            }

            res.json({ message: 'Customer updated successfully' });
        });
    });
});

// Delete customer
router.delete('/:id', auth, (req, res) => {
    const deleteQuery = 'DELETE FROM customers WHERE id = ? AND user_id = ?';
    mysqlConnection.query(deleteQuery, [req.params.id, req.user.id], (err, result) => {
        if (err) {
            console.error('Error deleting customer:', err);
            return res.status(500).json({ error: 'Failed to delete customer' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ message: 'Customer deleted successfully' });
    });
});

module.exports = router;
