const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mysqlConnection = require('../config/database');

// Get milk data
router.get('/', auth, async (req, res) => {
    try {
        const { startDate, endDate, customerName, milkType } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ 
                error: 'Missing date parameters',
                message: 'Both startDate and endDate are required'
            });
        }

        let query = `
            SELECT * FROM milk 
            WHERE user_id = ? AND date BETWEEN ? AND ?
        `;
        const params = [req.user.id, startDate, endDate];

        if (customerName) {
            query += ' AND customer_name = ?';
            params.push(customerName);
        }

        if (milkType) {
            query += ' AND milk_type = ?';
            params.push(milkType);
        }

        query += ' ORDER BY date DESC, milk_type';

        // Remove array destructuring here
        const rows = await mysqlConnection.query(query, params);
        console.log("the rows are:", rows);

        // Ensure we're working with an array
        const formattedRows = Array.isArray(rows) 
            ? rows.map(row => ({
                id: row.id,
                customerName: row.customer_name,
                milkType: row.milk_type,
                liters: Number(row.liters),
                rate: Number(row.rate),
                cashReceived: Number(row.cash_received || 0),
                creditDue: Number(row.credit_due || 0),
                date: row.date,
                userId: row.user_id
            }))
            : [];

        res.status(200).json({
            success: true,
            data: formattedRows,
            message: 'Milk data retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching milk data:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch milk data',
            message: error.message
        });
    }
});

// Add milk entry
router.post('/', auth, async (req, res) => {
    try {
        const { customerName, milkType, liters, rate, cashReceived, creditDue, date } = req.body;

        if (!customerName || !milkType || !liters || !rate || !date) {
            return res.status(400).json({ 
                success: false,
                error: 'Missing required fields',
                message: 'Please provide all required fields: customerName, milkType, liters, rate, date'
            });
        }

        const [customerResults] = await mysqlConnection.query(
            'SELECT id FROM customers WHERE name = ? AND user_id = ?',
            [customerName, req.user.id]
        );

        if (customerResults.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid customer',
                message: 'The specified customer does not exist'
            });
        }

        const [insertResult] = await mysqlConnection.query(`
            INSERT INTO milk 
            (customer_name, milk_type, liters, rate, cash_received, credit_due, date, user_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            customerName,
            milkType,
            Number(liters),
            Number(rate),
            Number(cashReceived || 0),
            Number(creditDue || 0),
            date,
            req.user.id
        ]);

        res.status(201).json({ 
            success: true,
            data: {
                id: insertResult.insertId,
                customerName,
                milkType,
                liters: Number(liters),
                rate: Number(rate),
                cashReceived: Number(cashReceived || 0),
                creditDue: Number(creditDue || 0),
                date
            },
            message: 'Milk entry added successfully' 
        });
    } catch (error) {
        console.error('Error adding milk entry:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to add milk entry',
            message: error.message
        });
    }
});

// Update milk entry
router.put('/:id', auth, async (req, res) => {
    try {
        const { customerName, milkType, liters, rate, cashReceived, creditDue, date } = req.body;

        const [updateResult] = await mysqlConnection.query(`
            UPDATE milk 
            SET customer_name = ?, milk_type = ?, liters = ?, 
                rate = ?, cash_received = ?, credit_due = ?, date = ?
            WHERE id = ? AND user_id = ?
        `, [
            customerName, 
            milkType, 
            Number(liters), 
            Number(rate), 
            Number(cashReceived || 0), 
            Number(creditDue || 0), 
            date, 
            req.params.id, 
            req.user.id
        ]);

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Milk entry not found',
                message: 'No milk entry found with the specified ID'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Milk entry updated successfully',
            affectedRows: updateResult.affectedRows
        });
    } catch (error) {
        console.error('Error updating milk entry:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to update milk entry',
            message: error.message
        });
    }
});

// Delete milk entry
router.delete('/:id', auth, async (req, res) => {
    try {
        const [deleteResult] = await mysqlConnection.query(
            'DELETE FROM milk WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (deleteResult.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Milk entry not found',
                message: 'No milk entry found with the specified ID'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Milk entry deleted successfully',
            affectedRows: deleteResult.affectedRows
        });
    } catch (error) {
        console.error('Error deleting milk entry:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to delete milk entry',
            message: error.message
        });
    }
});

module.exports = router;
