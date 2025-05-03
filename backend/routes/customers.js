const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const auth = require('../middleware/auth');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Get all customers for the authenticated user
router.get('/', auth, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [rows] = await connection.query(
            'SELECT * FROM customers WHERE user_id = ? ORDER BY name',
            [req.user.id]
        );
        
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// Add a new customer
router.post('/', auth, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Customer name is required' });
        }

        const connection = await pool.getConnection();

        // Check if customer already exists for this user
        const [existing] = await connection.query(
            'SELECT * FROM customers WHERE name = ? AND user_id = ?',
            [name, req.user.id]
        );

        if (existing.length > 0) {
            connection.release();
            return res.status(400).json({ error: 'Customer already exists' });
        }

        // Insert new customer
        const [result] = await connection.query(
            'INSERT INTO customers (name, user_id) VALUES (?, ?)',
            [name, req.user.id]
        );

        const newCustomer = {
            id: result.insertId,
            name,
            user_id: req.user.id
        };

        connection.release();
        res.status(201).json({ ...newCustomer, message: 'Customer added successfully' });
    } catch (error) {
        console.error('Error adding customer:', error);
        res.status(500).json({ error: 'Failed to add customer' });
    }
});

// Update customer
router.put('/:id', auth, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Customer name is required' });
        }

        const connection = await pool.getConnection();

        // Check if the new name already exists for another customer
        const [existing] = await connection.query(
            'SELECT * FROM customers WHERE name = ? AND user_id = ? AND id != ?',
            [name, req.user.id, req.params.id]
        );

        if (existing.length > 0) {
            connection.release();
            return res.status(400).json({ error: 'Customer name already exists' });
        }

        const [result] = await connection.query(
            'UPDATE customers SET name = ? WHERE id = ? AND user_id = ?',
            [name, req.params.id, req.user.id]
        );

        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ message: 'Customer updated successfully' });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

// Delete customer
router.delete('/:id', auth, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [result] = await connection.query(
            'DELETE FROM customers WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

module.exports = router;
