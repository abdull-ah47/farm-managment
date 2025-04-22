const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const auth = require('../middleware/auth');
const { Milk } = require('../models/Milk');
const { User } = require('../models/User');
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

// Get milk data
router.get('/', auth, async (req, res) => {
    try {
        console.log('Received request for milk data with query:', req.query);
        const { startDate, endDate, customerName, milkType } = req.query;
        
        // Validate dates
        if (!startDate || !endDate) {
            console.log('Missing date parameters');
            return res.status(400).json({ 
                error: 'Missing date parameters',
                message: 'Both startDate and endDate are required'
            });
        }

        // Build the base query
        let query = `
            SELECT m.*, c.name as customer_name 
            FROM milk m
            LEFT JOIN customers c ON m.customer_name = c.name AND m.user_id = c.user_id
            WHERE m.user_id = ? 
            AND m.date BETWEEN ? AND ?
        `;
        
        let params = [req.user.id, startDate, endDate];

        // Add optional filters
        if (customerName) {
            query += ' AND m.customer_name = ?';
            params.push(customerName);
        }
        if (milkType) {
            query += ' AND m.milk_type = ?';
            params.push(milkType);
        }

        // Add ordering
        query += ' ORDER BY m.date DESC, m.milk_type';

        console.log('Executing query:', query);
        console.log('With parameters:', params);

        const connection = await pool.getConnection();
        const [rows] = await connection.query(query, params);
        
        console.log(`Found ${rows.length} records`);
        
        // Format numeric values
        const formattedRows = rows.map(row => ({
            ...row,
            id: row.id,
            customerName: row.customer_name,
            milkType: row.milk_type,
            liters: Number(row.liters),
            rate: Number(row.rate),
            cashReceived: Number(row.cash_received || 0),
            creditDue: Number(row.credit_due || 0),
            date: row.date,
            userId: row.user_id
        }));
        
        connection.release();
        res.json(formattedRows);
    } catch (error) {
        console.error('Error fetching milk data:', error);
        res.status(500).json({ 
            error: 'Failed to fetch milk data',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Add milk entry
router.post('/', auth, async (req, res) => {
    try {
        console.log('Received milk entry data:', req.body);
        const { customerName, milkType, liters, rate, cashReceived, creditDue, date } = req.body;

        // Validate required fields
        if (!customerName || !milkType || !liters || !rate || !date) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                message: 'Please provide all required fields: customerName, milkType, liters, rate, date'
            });
        }

        const connection = await pool.getConnection();

        // Verify customer exists
        const [customers] = await connection.query(
            'SELECT id FROM customers WHERE name = ? AND user_id = ?',
            [customerName, req.user.id]
        );

        if (customers.length === 0) {
            connection.release();
            return res.status(400).json({ 
                error: 'Invalid customer',
                message: 'The specified customer does not exist'
            });
        }

        // Insert milk entry with proper numeric values
        const [result] = await connection.query(
            `INSERT INTO milk 
             (customer_name, milk_type, liters, rate, cash_received, credit_due, date, user_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                customerName,
                milkType,
                Number(liters),
                Number(rate),
                Number(cashReceived || 0),
                Number(creditDue || 0),
                date,
                req.user.id
            ]
        );

        connection.release();
        
        // Return the newly created entry
        res.status(201).json({ 
            id: result.insertId,
            customerName,
            milkType,
            liters: Number(liters),
            rate: Number(rate),
            cashReceived: Number(cashReceived || 0),
            creditDue: Number(creditDue || 0),
            date,
            message: 'Milk entry added successfully' 
        });
    } catch (error) {
        console.error('Error adding milk entry:', error);
        res.status(500).json({ error: 'Failed to add milk entry' });
    }
});

// Also support the /add endpoint for backward compatibility
router.post('/add', auth, async (req, res) => {
    try {
        console.log('Received milk entry data on /add endpoint:', req.body);
        const { customerName, milkType, liters, rate, cashReceived, creditDue, date } = req.body;

        // Validate required fields
        if (!customerName || !milkType || !liters || !rate || !date) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                message: 'Please provide all required fields: customerName, milkType, liters, rate, date'
            });
        }

        const connection = await pool.getConnection();

        // Verify customer exists
        const [customers] = await connection.query(
            'SELECT id FROM customers WHERE name = ? AND user_id = ?',
            [customerName, req.user.id]
        );

        if (customers.length === 0) {
            connection.release();
            return res.status(400).json({ 
                error: 'Invalid customer',
                message: 'The specified customer does not exist'
            });
        }

        // Insert milk entry with proper numeric values
        const [result] = await connection.query(
            `INSERT INTO milk 
             (customer_name, milk_type, liters, rate, cash_received, credit_due, date, user_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                customerName,
                milkType,
                Number(liters),
                Number(rate),
                Number(cashReceived || 0),
                Number(creditDue || 0),
                date,
                req.user.id
            ]
        );

        connection.release();
        
        // Return the newly created entry
        res.status(201).json({ 
            id: result.insertId,
            customerName,
            milkType,
            liters: Number(liters),
            rate: Number(rate),
            cashReceived: Number(cashReceived || 0),
            creditDue: Number(creditDue || 0),
            date,
            message: 'Milk entry added successfully' 
        });
    } catch (error) {
        console.error('Error adding milk entry:', error);
        res.status(500).json({ error: 'Failed to add milk entry' });
    }
});

// Update milk entry
router.put('/:id', auth, async (req, res) => {
    try {
        const { customerName, milkType, liters, rate, cashReceived, creditDue, date } = req.body;
        const connection = await pool.getConnection();

        const [result] = await connection.query(
            `UPDATE milk 
             SET customer_name = ?, milk_type = ?, liters = ?, 
                 rate = ?, cash_received = ?, credit_due = ?, date = ?
             WHERE id = ? AND user_id = ?`,
            [customerName, milkType, liters, rate, cashReceived, creditDue, date, req.params.id, req.user.id]
        );

        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Milk entry not found' });
        }

        res.json({ message: 'Milk entry updated successfully' });
    } catch (error) {
        console.error('Error updating milk entry:', error);
        res.status(500).json({ error: 'Failed to update milk entry' });
    }
});

// Delete milk entry
router.delete('/:id', auth, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [result] = await connection.query(
            'DELETE FROM milk WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Milk entry not found' });
        }

        res.json({ message: 'Milk entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting milk entry:', error);
        res.status(500).json({ error: 'Failed to delete milk entry' });
    }
});

module.exports = router; 