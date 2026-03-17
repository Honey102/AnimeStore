const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '../data/users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'animestore_secret_2026_$';

// Helper: read/write users
function readUsers() {
    try {
        if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch { return []; }
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
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

    const users = readUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
        return res.status(400).json({ success: false, message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = {
        id: `user_${Date.now()}`,
        name,
        email: email.toLowerCase(),
        password: hashed,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        favoriteAnime: '',
        wishlist: [],
        orders: [],
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);

    const token = jwt.sign({ id: newUser.id, email: newUser.email, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userSafe } = newUser;
    res.status(201).json({ success: true, token, user: userSafe, message: 'Account created! Welcome to AnimeStore 🎌' });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ success: false, message: 'Email and password required' });

    const users = readUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userSafe } = user;
    res.json({ success: true, token, user: userSafe, message: `Welcome back, ${user.name}! 🎌` });
});

// GET /api/auth/profile — get current user's profile
router.get('/profile', authMiddleware, (req, res) => {
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { password, ...userSafe } = user;
    res.json({ success: true, user: userSafe });
});

// PUT /api/auth/profile — update profile
router.put('/profile', authMiddleware, (req, res) => {
    const { name, favoriteAnime } = req.body;
    const users = readUsers();
    const idx = users.findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'User not found' });

    if (name) users[idx].name = name;
    if (favoriteAnime !== undefined) users[idx].favoriteAnime = favoriteAnime;
    writeUsers(users);

    const { password, ...userSafe } = users[idx];
    res.json({ success: true, user: userSafe, message: 'Profile updated!' });
});

// POST /api/auth/wishlist/:productId — toggle wishlist
router.post('/wishlist/:productId', authMiddleware, (req, res) => {
    const users = readUsers();
    const idx = users.findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'User not found' });

    const pid = parseInt(req.params.productId);
    const wl = users[idx].wishlist || [];
    const exists = wl.includes(pid);

    users[idx].wishlist = exists ? wl.filter(id => id !== pid) : [...wl, pid];
    writeUsers(users);

    res.json({
        success: true,
        wishlisted: !exists,
        wishlist: users[idx].wishlist,
        message: exists ? 'Removed from wishlist' : 'Added to wishlist ❤️'
    });
});

// GET /api/auth/wishlist — get user's wishlist products
router.get('/wishlist', authMiddleware, (req, res) => {
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const products = require('../data/products');
    const wishlistProducts = products.filter(p => (user.wishlist || []).includes(p.id));
    res.json({ success: true, products: wishlistProducts, ids: user.wishlist || [] });
});

// POST /api/auth/orders — save order to user profile
router.post('/orders', authMiddleware, (req, res) => {
    const { items, total, customer } = req.body;
    const users = readUsers();
    const idx = users.findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'User not found' });

    const order = {
        id: `ORD-${Date.now()}`,
        items,
        total,
        customer,
        status: 'confirmed',
        createdAt: new Date().toISOString()
    };
    users[idx].orders = [order, ...(users[idx].orders || [])];
    writeUsers(users);

    res.status(201).json({ success: true, order, message: 'Order placed! 🎌' });
});

module.exports = { router, authMiddleware };
