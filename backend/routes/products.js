const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');
const SETTINGS_FILE = path.join(__dirname, '../data/settings.json');

/** Read products fresh each time so admin edits are reflected immediately */
function readProducts() {
    try {
        if (!fs.existsSync(PRODUCTS_FILE)) return [];
        return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
    } catch { return []; }
}

function readSettings() {
    try {
        if (!fs.existsSync(SETTINGS_FILE)) return {};
        return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    } catch { return {}; }
}

// GET /api/products — all products with optional filters
router.get('/', (req, res) => {
    let result = readProducts();
    const { category, search, sort, anime } = req.query;

    if (category && category !== 'all') {
        result = result.filter(p => p.category === category);
    }
    if (anime) {
        result = result.filter(p => p.anime.toLowerCase().includes(anime.toLowerCase()));
    }
    if (search) {
        const q = search.toLowerCase();
        result = result.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.anime.toLowerCase().includes(q) ||
            (p.tags || []).some(t => t.includes(q))
        );
    }
    if (sort === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') result.sort((a, b) => b.rating - a.rating);
    else if (sort === 'popular') result.sort((a, b) => b.reviews - a.reviews);

    res.json({ success: true, count: result.length, products: result });
});

// GET /api/products/flash-sale — respects admin-configured flash sale product list
router.get('/flash-sale', (req, res) => {
    const products = readProducts();
    const settings = readSettings();
    const flashConfig = settings.flashSale || {};

    let flashProducts;
    if (flashConfig.active && flashConfig.productIds && flashConfig.productIds.length > 0) {
        // Admin-selected flash sale products
        flashProducts = products
            .filter(p => flashConfig.productIds.includes(p.id) && p.originalPrice > p.price)
            .map(p => ({
                ...p,
                discountPct: Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
            }));
    } else {
        // Fallback: highest-discount products
        flashProducts = products
            .filter(p => p.originalPrice && p.originalPrice > p.price)
            .map(p => ({
                ...p,
                discountPct: Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
            }))
            .sort((a, b) => b.discountPct - a.discountPct)
            .slice(0, 6);
    }
    res.json({ success: true, products: flashProducts, flashTitle: flashConfig.title || "Today's Hot Deals" });
});

// GET /api/products/featured — featured products for homepage
router.get('/featured', (req, res) => {
    const products = readProducts();
    const featured = products.filter(p => p.badge && p.badge !== '').slice(0, 8);
    res.json({ success: true, products: featured });
});

// GET /api/products/categories — from settings.json (admin-managed)
router.get('/categories', (req, res) => {
    const settings = readSettings();
    const baseCategory = [{ id: 'all', label: 'All Products', icon: '🎌' }];
    const cats = settings.categories || [
        { id: 'action-figures', label: 'Action Figures', icon: '🗡️' },
        { id: 'keychains',      label: 'Keychains',      icon: '🔑' },
        { id: 'posters',        label: 'Posters',        icon: '🖼️' },
        { id: 'clothing',       label: 'Clothing',       icon: '👕' },
        { id: 'accessories',    label: 'Accessories',    icon: '✨' },
    ];
    res.json({ success: true, categories: [...baseCategory, ...cats] });
});

// GET /api/products/:id — single product + related
router.get('/:id', (req, res) => {
    const products = readProducts();
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
    res.json({ success: true, product, related });
});

module.exports = router;
