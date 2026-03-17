const express = require('express');
const router = express.Router();
const products = require('../data/products');

// GET /api/products — all products with optional filters
router.get('/', (req, res) => {
    let result = [...products];
    const { category, search, sort, anime } = req.query;

    if (category && category !== 'all') {
        result = result.filter(p => p.category === category);
    }

    if (anime) {
        result = result.filter(p =>
            p.anime.toLowerCase().includes(anime.toLowerCase())
        );
    }

    if (search) {
        const q = search.toLowerCase();
        result = result.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.anime.toLowerCase().includes(q) ||
            p.tags.some(t => t.includes(q))
        );
    }

    if (sort === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') result.sort((a, b) => b.rating - a.rating);
    else if (sort === 'popular') result.sort((a, b) => b.reviews - a.reviews);

    res.json({ success: true, count: result.length, products: result });
});

// GET /api/products/flash-sale — top discounted products for flash sale section
router.get('/flash-sale', (req, res) => {
    const flashProducts = products
        .filter(p => p.originalPrice && p.originalPrice > p.price)
        .map(p => ({
            ...p,
            discountPct: Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
        }))
        .sort((a, b) => b.discountPct - a.discountPct)
        .slice(0, 6);
    res.json({ success: true, products: flashProducts });
});

// GET /api/products/featured — featured products for homepage
router.get('/featured', (req, res) => {
    const featured = products
        .filter(p => p.badge && p.badge !== '')
        .slice(0, 8);
    res.json({ success: true, products: featured });
});

// GET /api/products/categories — all categories
router.get('/categories', (req, res) => {
    const categories = [
        { id: 'all', label: 'All Products', icon: '🎌' },
        { id: 'action-figures', label: 'Action Figures', icon: '🗡️' },
        { id: 'keychains', label: 'Keychains', icon: '🔑' },
        { id: 'posters', label: 'Posters', icon: '🖼️' },
        { id: 'clothing', label: 'Clothing', icon: '👕' },
        { id: 'accessories', label: 'Accessories', icon: '✨' },
    ];
    res.json({ success: true, categories });
});

// GET /api/products/:id — single product
router.get('/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }
    // Get related products (same category, excluding current)
    const related = products
        .filter(p => p.category === product.category && p.id !== product.id)
        .slice(0, 4);
    res.json({ success: true, product, related });
});

module.exports = router;
