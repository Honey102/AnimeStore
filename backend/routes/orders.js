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
    const { items, customer } = req.body;
    if (!items || !items.length) {
        return res.status(400).json({ success: false, message: 'No items in order' });
    }

    // ── Server-side total recalculation (security: ignore client-sent total) ──
    const shipping = (() => {
        const sub = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        return sub > 999 ? 0 : 99;
    })();
    const serverTotal = items.reduce((sum, i) => {
        if (!i.price || !i.quantity || i.quantity < 1) return sum;
        return sum + (i.price * i.quantity);
    }, 0) + shipping;

    const orders = readOrders();
    const order = {
        id: `ORD-${Date.now()}`,
        items,
        customer: customer || { name: 'Guest' },
        total: serverTotal,
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

