const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'animestore_secret_2026_$';
if (!process.env.JWT_SECRET) {
    console.warn('⚠️  WARNING: JWT_SECRET env variable not set! Using hardcoded fallback.');
}

// Middleware: verify JWT
function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
        return res.status(400).json({ success: false, message: 'All fields required' });
    if (password.length < 6)
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    try {
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existing.rows.length > 0)
            return res.status(400).json({ success: false, message: 'Email already registered' });

        const hashed = await bcrypt.hash(password, 10);
        const id = `user_${Date.now()}`;
        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

        const result = await pool.query(
            `INSERT INTO users (id, name, email, password, avatar, favorite_anime, wishlist)
             VALUES ($1,$2,$3,$4,$5,'',$6) RETURNING *`,
            [id, name, email.toLowerCase(), hashed, avatar, []]
        );
        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

        const { password: _, ...userSafe } = user;
        res.status(201).json({ success: true, token, user: toUserResponse(userSafe), message: 'Account created! Welcome to AnimeStore 🎌' });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ success: false, message: 'Email and password required' });

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        const user = result.rows[0];
        if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ success: false, message: 'Invalid email or password' });

        const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
        const { password: _, ...userSafe } = user;
        res.json({ success: true, token, user: toUserResponse(userSafe), message: `Welcome back, ${user.name}! 🎌` });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// GET /api/auth/profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
        const user = result.rows[0];
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        const { password, ...userSafe } = user;
        res.json({ success: true, user: toUserResponse(userSafe) });
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, async (req, res) => {
    const { name, favoriteAnime } = req.body;
    try {
        const result = await pool.query(
            `UPDATE users SET name = COALESCE($1, name), favorite_anime = COALESCE($2, favorite_anime)
             WHERE id = $3 RETURNING *`,
            [name || null, favoriteAnime !== undefined ? favoriteAnime : null, req.user.id]
        );
        const user = result.rows[0];
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        const { password, ...userSafe } = user;
        res.json({ success: true, user: toUserResponse(userSafe), message: 'Profile updated!' });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/auth/wishlist/:productId — toggle
router.post('/wishlist/:productId', authMiddleware, async (req, res) => {
    const pid = parseInt(req.params.productId);
    try {
        const result = await pool.query('SELECT wishlist FROM users WHERE id = $1', [req.user.id]);
        const user = result.rows[0];
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const wl = user.wishlist || [];
        const exists = wl.includes(pid);
        const newWl = exists ? wl.filter(id => id !== pid) : [...wl, pid];

        await pool.query('UPDATE users SET wishlist = $1 WHERE id = $2', [newWl, req.user.id]);

        res.json({
            success: true,
            wishlisted: !exists,
            wishlist: newWl,
            message: exists ? 'Removed from wishlist' : 'Added to wishlist ❤️'
        });
    } catch (err) {
        console.error('Wishlist error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/auth/wishlist
router.get('/wishlist', authMiddleware, async (req, res) => {
    try {
        const userResult = await pool.query('SELECT wishlist FROM users WHERE id = $1', [req.user.id]);
        const user = userResult.rows[0];
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const ids = user.wishlist || [];
        let products = [];
        if (ids.length > 0) {
            const pResult = await pool.query(
                'SELECT * FROM products WHERE id = ANY($1)', [ids]
            );
            products = pResult.rows.map(toProductResponse);
        }
        res.json({ success: true, products, ids });
    } catch (err) {
        console.error('Wishlist fetch error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/auth/orders — save order to user profile
router.post('/orders', authMiddleware, async (req, res) => {
    const { items, total, customer } = req.body;
    try {
        const orderId = `ORD-${Date.now()}`;
        const shipping = items.reduce((sum, i) => sum + (i.price * i.quantity), 0) > 999 ? 0 : 99;
        const serverTotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0) + shipping;

        const result = await pool.query(
            `INSERT INTO orders (id, user_id, items, customer, total, status, source)
             VALUES ($1,$2,$3,$4,$5,'confirmed','user') RETURNING *`,
            [orderId, req.user.id, JSON.stringify(items), JSON.stringify(customer), serverTotal]
        );
        res.status(201).json({ success: true, order: result.rows[0], message: 'Order placed! 🎌' });
    } catch (err) {
        console.error('Order error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/auth/orders — get user's own orders
router.get('/orders', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json({ success: true, orders: result.rows });
    } catch (err) {
        console.error('Orders fetch error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ── Helper: normalize DB row to frontend-expected shape ──────────────────────
function toUserResponse(u) {
    return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        favoriteAnime: u.favorite_anime,
        wishlist: u.wishlist || [],
        orders: u.orders || [],
        createdAt: u.created_at,
    };
}

function toProductResponse(p) {
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

// PUT /api/auth/change-password
router.put('/change-password', authMiddleware, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
        return res.status(400).json({ success: false, message: 'Both current and new password required' });
    if (newPassword.length < 6)
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    if (currentPassword === newPassword)
        return res.status(400).json({ success: false, message: 'New password must be different from current' });

    try {
        const result = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
        const user = result.rows[0];
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

        const hashed = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);
        res.json({ success: true, message: 'Password changed successfully! 🔒' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = { router, authMiddleware };
