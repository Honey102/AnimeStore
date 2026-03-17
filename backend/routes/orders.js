const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authMiddleware } = require('./auth');

const ORDERS_FILE = path.join(__dirname, '../data/orders.json');

function readOrders() {
    try {
        if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]');
        return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
    } catch { return []; }
}

function writeOrders(orders) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// POST /api/orders — place an order (guest or logged-in)
router.post('/', (req, res) => {
    const { items, customer, total } = req.body;
    if (!items || !items.length) {
        return res.status(400).json({ success: false, message: 'No items in order' });
    }
    const orders = readOrders();
    const order = {
        id: `ORD-${Date.now()}`,
        items,
        customer: customer || { name: 'Guest' },
        total,
        status: 'confirmed',
        createdAt: new Date().toISOString()
    };
    orders.unshift(order);
    writeOrders(orders);
    res.status(201).json({ success: true, order, message: 'Order placed successfully! 🎌' });
});

// GET /api/orders — all orders (protected, requires auth)
router.get('/', authMiddleware, (req, res) => {
    const orders = readOrders();
    res.json({ success: true, count: orders.length, orders });
});

module.exports = router;

