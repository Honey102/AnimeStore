const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const pool = require('../db');
const { adminMiddleware, ADMIN_SECRET } = require('../middleware/adminAuth');

// ── Image Upload Setup ────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `product_${Date.now()}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Only image files allowed (jpg, png, webp, gif)'));
    }
});

// ── Helper: normalize product ─────────────────────────────────────────────────
function toProduct(p) {
    return {
        id: p.id,
        name: p.name,
        category: p.category,
        anime: p.anime,
        price: parseFloat(p.price),
        originalPrice: parseFloat(p.original_price),
        rating: parseFloat(p.rating),
        reviews: p.reviews,
        stock: p.stock,
        image: p.image,
        badge: p.badge,
        description: p.description,
        tags: p.tags || [],
    };
}

// ── Get all settings as a single object ──────────────────────────────────────
async function getAllSettings() {
    const result = await pool.query('SELECT key, value FROM settings');
    return result.rows.reduce((obj, row) => ({ ...obj, [row.key]: row.value }), {});
}

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  POST /api/admin/login                                                   ║
// ╚══════════════════════════════════════════════════════════════════════════╝
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const adminEmail    = (process.env.ADMIN_EMAIL    || 'admin@animestore.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD  || 'admin@animestore123';

    if (email.toLowerCase() !== adminEmail || password !== adminPassword) {
        return res.status(401).json({ success: false, message: 'Invalid admin credentials 🚫' });
    }
    const token = jwt.sign({ role: 'admin', loginAt: Date.now() }, ADMIN_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token, message: 'Welcome back, Admin! 🎌' });
});

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  POST /api/admin/upload  (image)                                         ║
// ╚══════════════════════════════════════════════════════════════════════════╝
router.post('/upload', adminMiddleware, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided' });
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl, message: '✅ Image uploaded successfully!' });
});

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  GET /api/admin/overview                                                 ║
// ╚══════════════════════════════════════════════════════════════════════════╝
router.get('/overview', adminMiddleware, async (req, res) => {
    try {
        const [productsResult, usersResult, allOrdersResult] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM products'),
            pool.query('SELECT COUNT(*) FROM users'),
            pool.query('SELECT * FROM orders ORDER BY created_at DESC'),
        ]);

        const allOrders = allOrdersResult.rows;
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

        const monthOrders = allOrders.filter(o => new Date(o.created_at) >= monthStart);
        const monthRevenue = monthOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
        const todayOrders = allOrders.filter(o => new Date(o.created_at) >= todayStart);

        const lowStockResult = await pool.query(
            'SELECT * FROM products WHERE stock <= 10 ORDER BY stock ASC LIMIT 6'
        );
        const topProductsResult = await pool.query(
            'SELECT * FROM products ORDER BY reviews DESC LIMIT 5'
        );

        res.json({
            success: true,
            stats: {
                totalProducts: parseInt(productsResult.rows[0].count),
                totalOrders: allOrders.length,
                todayOrders: todayOrders.length,
                totalUsers: parseInt(usersResult.rows[0].count),
                monthRevenue,
                monthOrders: monthOrders.length,
            },
            recentOrders: allOrders.slice(0, 10).map(o => ({
                ...o,
                customer: typeof o.customer === 'string' ? JSON.parse(o.customer) : o.customer,
                items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
            })),
            lowStock: lowStockResult.rows.map(toProduct),
            topProducts: topProductsResult.rows.map(toProduct),
        });
    } catch (err) {
        console.error('Overview error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  PRODUCTS CRUD                                                           ║
// ╚══════════════════════════════════════════════════════════════════════════╝
router.get('/products', adminMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY id ASC');
        res.json({ success: true, products: result.rows.map(toProduct) });
    } catch (err) {
        console.error('Admin products error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/products', adminMiddleware, async (req, res) => {
    const tags = Array.isArray(req.body.tags)
        ? req.body.tags
        : (req.body.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    try {
        const result = await pool.query(
            `INSERT INTO products (name, category, anime, price, original_price, rating, reviews, stock, image, badge, description, tags)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
            [
                req.body.name || '', req.body.category || 'accessories', req.body.anime || '',
                Number(req.body.price) || 0, Number(req.body.originalPrice) || 0,
                Number(req.body.rating) || 4.5, Number(req.body.reviews) || 0,
                Number(req.body.stock) || 0, req.body.image || '',
                req.body.badge || '', req.body.description || '', tags
            ]
        );
        res.status(201).json({ success: true, product: toProduct(result.rows[0]), message: '✅ Product added!' });
    } catch (err) {
        console.error('Add product error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.put('/products/:id', adminMiddleware, async (req, res) => {
    const tags = Array.isArray(req.body.tags)
        ? req.body.tags
        : (req.body.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    try {
        const result = await pool.query(
            `UPDATE products SET
                name=$1, category=$2, anime=$3, price=$4, original_price=$5,
                rating=$6, reviews=$7, stock=$8, image=$9, badge=$10, description=$11, tags=$12
             WHERE id=$13 RETURNING *`,
            [
                req.body.name, req.body.category, req.body.anime,
                Number(req.body.price), Number(req.body.originalPrice),
                Number(req.body.rating), Number(req.body.reviews),
                Number(req.body.stock), req.body.image, req.body.badge,
                req.body.description, tags, parseInt(req.params.id)
            ]
        );
        if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, product: toProduct(result.rows[0]), message: '✅ Product updated!' });
    } catch (err) {
        console.error('Update product error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.delete('/products/:id', adminMiddleware, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM products WHERE id=$1 RETURNING id', [parseInt(req.params.id)]);
        if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, message: '🗑️ Product deleted!' });
    } catch (err) {
        console.error('Delete product error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ORDERS MANAGEMENT                                                       ║
// ╚══════════════════════════════════════════════════════════════════════════╝
router.get('/orders', adminMiddleware, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT o.*, u.email as customer_email
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `);
        const orders = result.rows.map(o => ({
            ...o,
            customer: typeof o.customer === 'string' ? JSON.parse(o.customer) : o.customer,
            items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
        }));
        res.json({ success: true, orders, count: orders.length });
    } catch (err) {
        console.error('Admin orders error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.put('/orders/:id/status', adminMiddleware, async (req, res) => {
    const { status } = req.body;
    const valid = ['confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    try {
        const result = await pool.query(
            'UPDATE orders SET status=$1 WHERE id=$2 RETURNING id',
            [status, req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json({ success: true, message: `Order status → ${status}` });
    } catch (err) {
        console.error('Order status update error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  USERS MANAGEMENT                                                        ║
// ╚══════════════════════════════════════════════════════════════════════════╝
router.get('/users', adminMiddleware, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.name, u.email, u.avatar, u.favorite_anime, u.wishlist, u.created_at,
                   COUNT(o.id) as orders_count,
                   COALESCE(SUM(o.total), 0) as total_spent
            FROM users u
            LEFT JOIN orders o ON o.user_id = u.id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);
        const users = result.rows.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            avatar: u.avatar,
            favoriteAnime: u.favorite_anime,
            wishlist: u.wishlist || [],
            createdAt: u.created_at,
            ordersCount: parseInt(u.orders_count),
            totalSpent: parseFloat(u.total_spent),
        }));
        res.json({ success: true, users, count: users.length });
    } catch (err) {
        console.error('Admin users error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.delete('/users/:id', adminMiddleware, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM users WHERE id=$1 RETURNING id', [req.params.id]);
        if (!result.rows[0]) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, message: '🗑️ User deleted!' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  SETTINGS                                                                ║
// ╚══════════════════════════════════════════════════════════════════════════╝
router.get('/settings', adminMiddleware, async (req, res) => {
    try {
        res.json({ success: true, settings: await getAllSettings() });
    } catch (err) {
        console.error('Settings fetch error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.put('/settings', adminMiddleware, async (req, res) => {
    try {
        for (const [key, value] of Object.entries(req.body)) {
            await pool.query(
                `INSERT INTO settings (key, value) VALUES ($1, $2)
                 ON CONFLICT (key) DO UPDATE SET value = $2`,
                [key, JSON.stringify(value)]
            );
        }
        res.json({ success: true, settings: await getAllSettings(), message: '✅ Settings saved!' });
    } catch (err) {
        console.error('Settings update error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Change admin password (stores in DB settings)
router.post('/change-password', adminMiddleware, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin@animestore123';
    if (currentPassword !== adminPassword)
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    if (!newPassword || newPassword.length < 6)
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    // Note: update ADMIN_PASSWORD in your .env or Render environment variables
    res.json({ success: true, message: `⚠️ Update ADMIN_PASSWORD in your .env / Render env vars to: ${newPassword}` });
});

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  EXPORT DATA                                                             ║
// ╚══════════════════════════════════════════════════════════════════════════╝
router.get('/export/orders', adminMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        let csv = 'Order ID,Customer Name,Customer Email,Items,Total,Status,Date\n';
        result.rows.forEach(o => {
            const c = typeof o.customer === 'string' ? JSON.parse(o.customer) : o.customer;
            const items = (typeof o.items === 'string' ? JSON.parse(o.items) : o.items)
                .map(i => `${i.name}(x${i.quantity})`).join('; ');
            csv += `"${o.id}","${c?.name || 'Guest'}","${c?.email || '-'}","${items}",${o.total},"${o.status}","${o.created_at}"\n`;
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Export failed' });
    }
});

router.get('/export/users', adminMiddleware, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.name, u.email, u.created_at,
                   COUNT(o.id) as orders_count,
                   COALESCE(SUM(o.total), 0) as total_spent,
                   array_length(u.wishlist, 1) as wishlist_count
            FROM users u
            LEFT JOIN orders o ON o.user_id = u.id
            GROUP BY u.id ORDER BY u.created_at DESC
        `);
        let csv = 'ID,Name,Email,Orders,Wishlist Items,Total Spent,Joined\n';
        result.rows.forEach(u => {
            csv += `"${u.id}","${u.name}","${u.email}",${u.orders_count},${u.wishlist_count || 0},${u.total_spent},"${u.created_at}"\n`;
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Export failed' });
    }
});

router.get('/export/products', adminMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY id ASC');
        res.setHeader('Content-Disposition', 'attachment; filename="products.json"');
        res.json(result.rows.map(toProduct));
    } catch (err) {
        res.status(500).json({ success: false, message: 'Export failed' });
    }
});

module.exports = router;
