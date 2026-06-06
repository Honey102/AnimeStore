const express = require('express');
const router = express.Router();
const pool = require('../db');

// Helper: normalize DB row to camelCase for frontend
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

// GET /api/products — all products with optional server-side filters
router.get('/', async (req, res) => {
    const { category, search, sort, anime, limit } = req.query;
    try {
        let query = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (category && category !== 'all') {
            params.push(category);
            query += ` AND category = $${params.length}`;
        }
        if (anime) {
            params.push(`%${anime.toLowerCase()}%`);
            query += ` AND LOWER(anime) LIKE $${params.length}`;
        }
        if (search) {
            const q = `%${search.toLowerCase()}%`;
            params.push(q);
            query += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(anime) LIKE $${params.length} OR EXISTS (SELECT 1 FROM unnest(tags) t WHERE LOWER(t) LIKE $${params.length}))`;
        }

        // Sorting
        if (sort === 'price-asc')  query += ' ORDER BY price ASC';
        else if (sort === 'price-desc') query += ' ORDER BY price DESC';
        else if (sort === 'rating') query += ' ORDER BY rating DESC';
        else if (sort === 'popular') query += ' ORDER BY reviews DESC';
        else query += ' ORDER BY id ASC';

        // Optional limit
        if (limit && parseInt(limit) > 0) {
            query += ` LIMIT ${parseInt(limit)}`;
        }

        const result = await pool.query(query, params);
        const products = result.rows.map(toProduct);

        // Cache for 30 seconds — products rarely change mid-session
        res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
        res.json({ success: true, count: products.length, products });
    } catch (err) {
        console.error('Products fetch error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/products/flash-sale — admin-configured flash sale
router.get('/flash-sale', async (req, res) => {
    try {
        const settingsResult = await pool.query(`SELECT value FROM settings WHERE key = 'flashSale'`);
        const flashConfig = settingsResult.rows[0]?.value || {};

        let products;
        if (flashConfig.active && flashConfig.productIds?.length > 0) {
            const result = await pool.query(
                'SELECT * FROM products WHERE id = ANY($1) AND original_price > price',
                [flashConfig.productIds]
            );
            products = result.rows.map(p => ({
                ...toProduct(p),
                discountPct: Math.round(((p.original_price - p.price) / p.original_price) * 100)
            }));
        } else {
            const result = await pool.query(
                'SELECT * FROM products WHERE original_price > price ORDER BY (original_price - price) / original_price DESC LIMIT 6'
            );
            products = result.rows.map(p => ({
                ...toProduct(p),
                discountPct: Math.round(((p.original_price - p.price) / p.original_price) * 100)
            }));
        }

        res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
        res.json({ success: true, products, flashTitle: flashConfig.title || "Today's Hot Deals" });
    } catch (err) {
        console.error('Flash sale error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/products/featured — top badged products for Home page
router.get('/featured', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM products ORDER BY reviews DESC LIMIT 8`
        );
        res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
        res.json({ success: true, products: result.rows.map(toProduct) });
    } catch (err) {
        console.error('Featured error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/products/categories — admin-managed categories
router.get('/categories', async (req, res) => {
    try {
        const result = await pool.query(`SELECT value FROM settings WHERE key = 'categories'`);
        const cats = result.rows[0]?.value || [
            { id: 'action-figures', label: 'Action Figures', icon: '🗡️' },
            { id: 'keychains',      label: 'Keychains',      icon: '🔑' },
            { id: 'posters',        label: 'Posters',        icon: '🖼️' },
            { id: 'clothing',       label: 'Clothing',       icon: '👕' },
            { id: 'accessories',    label: 'Accessories',    icon: '✨' },
        ];
        res.set('Cache-Control', 'public, max-age=120');
        res.json({ success: true, categories: [{ id: 'all', label: 'All Products', icon: '🎌' }, ...cats] });
    } catch (err) {
        console.error('Categories error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/products/:id — single product + related
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [parseInt(req.params.id)]);
        const product = result.rows[0];
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        const related = await pool.query(
            'SELECT * FROM products WHERE category = $1 AND id != $2 LIMIT 4',
            [product.category, product.id]
        );

        res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
        res.json({ success: true, product: toProduct(product), related: related.rows.map(toProduct) });
    } catch (err) {
        console.error('Product detail error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
