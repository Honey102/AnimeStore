const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { adminMiddleware, ADMIN_SECRET } = require('../middleware/adminAuth');

// ── File Paths ──────────────────────────────────────────────────────────────
const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');
const ORDERS_FILE   = path.join(__dirname, '../data/orders.json');
const USERS_FILE    = path.join(__dirname, '../data/users.json');
const SETTINGS_FILE = path.join(__dirname, '../data/settings.json');

// ── Helpers ──────────────────────────────────────────────────────────────────
function readJSON(file, fallback = []) {
    try {
        if (!fs.existsSync(file)) { fs.writeFileSync(file, JSON.stringify(fallback, null, 2)); return fallback; }
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch { return fallback; }
}
function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
function defaultSettings() {
    return {
        flashSale: { active: false, title: "Today's Hot Deals", endTime: null, productIds: [] },
        siteSettings: { freeShippingThreshold: 999, shippingCost: 99, codAvailable: true, maintenanceMode: false },
        announcements: { active: false, text: 'Free shipping on orders above ₹999!' },
        categories: [
            { id: 'action-figures', label: 'Action Figures', icon: '🗡️' },
            { id: 'keychains',      label: 'Keychains',      icon: '🔑' },
            { id: 'posters',        label: 'Posters',        icon: '🖼️' },
            { id: 'clothing',       label: 'Clothing',       icon: '👕' },
            { id: 'accessories',    label: 'Accessories',    icon: '✨' },
        ]
    };
}
/** Merge guest orders + user orders into one list */
function getAllOrders() {
    const guestOrders = readJSON(ORDERS_FILE, []);
    const users = readJSON(USERS_FILE, []);
    const userOrders = users.flatMap(u =>
        (u.orders || []).map(o => ({ ...o, customerEmail: u.email, userId: u.id, source: 'user' }))
    );
    return [
        ...guestOrders.map(o => ({ ...o, source: 'guest' })),
        ...userOrders
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  POST /api/admin/login                                                   ║
// ╚══════════════════════════════════════════════════════════════════════════╝
router.post('/login', (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, message: 'Password required' });

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin@animestore123';
    if (password !== adminPassword) {
        return res.status(401).json({ success: false, message: 'Invalid admin password 🚫' });
    }
    const token = jwt.sign({ role: 'admin', loginAt: Date.now() }, ADMIN_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token, message: 'Welcome back, Admin! 🎌' });
});

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  GET /api/admin/overview                                                 ║
// ╚══════════════════════════════════════════════════════════════════════════╝
router.get('/overview', adminMiddleware, (req, res) => {
    const products = readJSON(PRODUCTS_FILE, []);
    const allOrders = getAllOrders();
    const users = readJSON(USERS_FILE, []);

    // Revenue & orders this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthOrders = allOrders.filter(o => new Date(o.createdAt) >= monthStart);
    const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Today's orders
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayOrders = allOrders.filter(o => new Date(o.createdAt) >= todayStart);

    // Low stock (≤ 10)
    const lowStock = products.filter(p => p.stock <= 10).sort((a, b) => a.stock - b.stock).slice(0, 6);

    // Top products by reviews
    const topProducts = [...products].sort((a, b) => b.reviews - a.reviews).slice(0, 5);

    res.json({
        success: true,
        stats: {
            totalProducts: products.length,
            totalOrders: allOrders.length,
            todayOrders: todayOrders.length,
            totalUsers: users.length,
            monthRevenue,
            monthOrders: monthOrders.length,
        },
        recentOrders: allOrders.slice(0, 10),
        lowStock,
        topProducts,
    });
});

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  PRODUCTS CRUD                                                           ║
// ╚══════════════════════════════════════════════════════════════════════════╝
router.get('/products', adminMiddleware, (req, res) => {
    res.json({ success: true, products: readJSON(PRODUCTS_FILE, []) });
});

router.post('/products', adminMiddleware, (req, res) => {
    const products = readJSON(PRODUCTS_FILE, []);
    const maxId = products.reduce((max, p) => Math.max(max, p.id || 0), 0);
    const tags = Array.isArray(req.body.tags)
        ? req.body.tags
        : (req.body.tags || '').split(',').map(t => t.trim()).filter(Boolean);

    const newProduct = {
        id: maxId + 1,
        name: req.body.name || '',
        category: req.body.category || 'accessories',
        anime: req.body.anime || '',
        price: Number(req.body.price) || 0,
        originalPrice: Number(req.body.originalPrice) || 0,
        rating: Number(req.body.rating) || 4.5,
        reviews: Number(req.body.reviews) || 0,
        stock: Number(req.body.stock) || 0,
        image: req.body.image || '',
        badge: req.body.badge || '',
        description: req.body.description || '',
        tags,
    };
    products.push(newProduct);
    writeJSON(PRODUCTS_FILE, products);
    res.status(201).json({ success: true, product: newProduct, message: '✅ Product added successfully!' });
});

router.put('/products/:id', adminMiddleware, (req, res) => {
    const products = readJSON(PRODUCTS_FILE, []);
    const idx = products.findIndex(p => p.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Product not found' });

    const tags = Array.isArray(req.body.tags)
        ? req.body.tags
        : (req.body.tags || '').split(',').map(t => t.trim()).filter(Boolean);

    products[idx] = {
        ...products[idx],
        ...req.body,
        id: products[idx].id, // preserve ID
        price: Number(req.body.price),
        originalPrice: Number(req.body.originalPrice),
        stock: Number(req.body.stock),
        rating: Number(req.body.rating) || products[idx].rating,
        reviews: Number(req.body.reviews) || products[idx].reviews,
        tags,
    };
    writeJSON(PRODUCTS_FILE, products);
    res.json({ success: true, product: products[idx], message: '✅ Product updated!' });
});

router.delete('/products/:id', adminMiddleware, (req, res) => {
    const products = readJSON(PRODUCTS_FILE, []);
    const filtered = products.filter(p => p.id !== parseInt(req.params.id));
    if (filtered.length === products.length) return res.status(404).json({ success: false, message: 'Product not found' });
    writeJSON(PRODUCTS_FILE, filtered);
    res.json({ success: true, message: '🗑️ Product deleted!' });
});

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ORDERS MANAGEMENT                                                       ║
// ╚══════════════════════════════════════════════════════════════════════════╝
router.get('/orders', adminMiddleware, (req, res) => {
    const allOrders = getAllOrders();
    res.json({ success: true, orders: allOrders, count: allOrders.length });
});

router.put('/orders/:id/status', adminMiddleware, (req, res) => {
    const { status } = req.body;
    const valid = ['confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status value' });

    const orderId = req.params.id;

    // Try guest orders first
    const guestOrders = readJSON(ORDERS_FILE, []);
    const guestIdx = guestOrders.findIndex(o => o.id === orderId);
    if (guestIdx !== -1) {
        guestOrders[guestIdx].status = status;
        writeJSON(ORDERS_FILE, guestOrders);
        return res.json({ success: true, message: `Order status → ${status}` });
    }

    // Try user orders
    const users = readJSON(USERS_FILE, []);
    let updated = false;
    for (const u of users) {
        if (!u.orders) continue;
        const oIdx = u.orders.findIndex(o => o.id === orderId);
        if (oIdx !== -1) { u.orders[oIdx].status = status; updated = true; break; }
    }
    if (updated) {
        writeJSON(USERS_FILE, users);
        return res.json({ success: true, message: `Order status → ${status}` });
    }
    res.status(404).json({ success: false, message: 'Order not found' });
});

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  USERS MANAGEMENT                                                        ║
// ╚══════════════════════════════════════════════════════════════════════════╝
router.get('/users', adminMiddleware, (req, res) => {
    const users = readJSON(USERS_FILE, []);
    const safeUsers = users.map(({ password, ...u }) => ({
        ...u,
        ordersCount: (u.orders || []).length,
        wishlistCount: (u.wishlist || []).length,
        totalSpent: (u.orders || []).reduce((sum, o) => sum + (o.total || 0), 0),
    }));
    res.json({ success: true, users: safeUsers, count: safeUsers.length });
});

router.delete('/users/:id', adminMiddleware, (req, res) => {
    const users = readJSON(USERS_FILE, []);
    const filtered = users.filter(u => u.id !== req.params.id);
    if (filtered.length === users.length) return res.status(404).json({ success: false, message: 'User not found' });
    writeJSON(USERS_FILE, filtered);
    res.json({ success: true, message: '🗑️ User account deleted!' });
});

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  SETTINGS                                                                ║
// ╚══════════════════════════════════════════════════════════════════════════╝
router.get('/settings', adminMiddleware, (req, res) => {
    const settings = readJSON(SETTINGS_FILE, defaultSettings());
    res.json({ success: true, settings });
});

router.put('/settings', adminMiddleware, (req, res) => {
    const current = readJSON(SETTINGS_FILE, defaultSettings());
    const updated = { ...current, ...req.body };
    writeJSON(SETTINGS_FILE, updated);
    res.json({ success: true, settings: updated, message: '✅ Settings saved!' });
});

// Change admin password
router.post('/change-password', adminMiddleware, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin@animestore123';
    if (currentPassword !== adminPassword) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }
    // Note: In a real app, this would update the DB/env. Here we just confirm — user must update .env manually
    res.json({ success: true, message: '⚠️ Please update ADMIN_PASSWORD in your .env file to: ' + newPassword });
});

// Export data
router.get('/export/orders', adminMiddleware, (req, res) => {
    const allOrders = getAllOrders();
    let csv = 'Order ID,Customer Name,Customer Email,Items,Total,Status,Date\n';
    allOrders.forEach(o => {
        const items = (o.items || []).map(i => `${i.name}(x${i.quantity})`).join('; ');
        const name = o.customer?.name || 'Guest';
        const email = o.customer?.email || o.customerEmail || '-';
        csv += `"${o.id}","${name}","${email}","${items}",${o.total},"${o.status}","${o.createdAt}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.send(csv);
});

router.get('/export/users', adminMiddleware, (req, res) => {
    const users = readJSON(USERS_FILE, []);
    let csv = 'ID,Name,Email,Orders,Wishlist Items,Total Spent,Joined\n';
    users.forEach(u => {
        const spent = (u.orders || []).reduce((s, o) => s + (o.total || 0), 0);
        csv += `"${u.id}","${u.name}","${u.email}",${(u.orders||[]).length},${(u.wishlist||[]).length},${spent},"${u.createdAt || ''}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    res.send(csv);
});

router.get('/export/products', adminMiddleware, (req, res) => {
    const products = readJSON(PRODUCTS_FILE, []);
    res.setHeader('Content-Disposition', 'attachment; filename="products.json"');
    res.json(products);
});

module.exports = router;
