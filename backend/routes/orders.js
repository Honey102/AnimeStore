const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('./auth');

// POST /api/orders — place guest order
router.post('/', async (req, res) => {
    const { items, customer } = req.body;
    if (!items || !items.length)
        return res.status(400).json({ success: false, message: 'No items in order' });

    const shipping = items.reduce((sum, i) => sum + (i.price * i.quantity), 0) > 999 ? 0 : 99;
    const serverTotal = items.reduce((sum, i) => {
        if (!i.price || !i.quantity || i.quantity < 1) return sum;
        return sum + (i.price * i.quantity);
    }, 0) + shipping;

    try {
        const orderId = `ORD-${Date.now()}`;
        const result = await pool.query(
            `INSERT INTO orders (id, user_id, items, customer, total, status, source)
             VALUES ($1, NULL, $2, $3, $4, 'confirmed', 'guest') RETURNING *`,
            [orderId, JSON.stringify(items), JSON.stringify(customer || { name: 'Guest' }), serverTotal]
        );
        res.status(201).json({ success: true, order: result.rows[0], message: 'Order placed successfully! 🎌' });
    } catch (err) {
        console.error('Order create error:', err);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// GET /api/orders — all orders (protected)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        res.json({ success: true, count: result.rows.length, orders: result.rows });
    } catch (err) {
        console.error('Orders list error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
