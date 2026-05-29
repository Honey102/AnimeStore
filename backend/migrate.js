/**
 * AnimeStore — Database Migration Script
 * Run once: node migrate.js
 * Creates all tables + seeds products from products.json
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('\n🎌 AnimeStore — Database Migration\n');
        console.log('📡 Connecting to PostgreSQL...');

        // ── Create Tables ──────────────────────────────────────────────────────
        console.log('📋 Creating tables...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id          VARCHAR(50)  PRIMARY KEY,
                name        VARCHAR(255) NOT NULL,
                email       VARCHAR(255) NOT NULL UNIQUE,
                password    VARCHAR(255) NOT NULL,
                avatar      TEXT,
                favorite_anime VARCHAR(255) DEFAULT '',
                wishlist    INTEGER[]    DEFAULT '{}',
                created_at  TIMESTAMPTZ  DEFAULT NOW()
            );
        `);
        console.log('  ✅ users table');

        await client.query(`
            CREATE TABLE IF NOT EXISTS products (
                id              SERIAL       PRIMARY KEY,
                name            VARCHAR(255) NOT NULL,
                category        VARCHAR(100) DEFAULT 'accessories',
                anime           VARCHAR(255) DEFAULT '',
                price           NUMERIC(10,2) NOT NULL DEFAULT 0,
                original_price  NUMERIC(10,2) DEFAULT 0,
                rating          NUMERIC(3,1)  DEFAULT 4.5,
                reviews         INTEGER       DEFAULT 0,
                stock           INTEGER       DEFAULT 0,
                image           TEXT          DEFAULT '',
                badge           VARCHAR(50)   DEFAULT '',
                description     TEXT          DEFAULT '',
                tags            TEXT[]        DEFAULT '{}'
            );
        `);
        console.log('  ✅ products table');

        await client.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id          VARCHAR(50)  PRIMARY KEY,
                user_id     VARCHAR(50)  REFERENCES users(id) ON DELETE SET NULL,
                items       JSONB        NOT NULL DEFAULT '[]',
                customer    JSONB        NOT NULL DEFAULT '{}',
                total       NUMERIC(10,2) NOT NULL DEFAULT 0,
                status      VARCHAR(50)  DEFAULT 'confirmed',
                source      VARCHAR(20)  DEFAULT 'guest',
                created_at  TIMESTAMPTZ  DEFAULT NOW()
            );
        `);
        console.log('  ✅ orders table');

        await client.query(`
            CREATE TABLE IF NOT EXISTS settings (
                key     VARCHAR(100) PRIMARY KEY,
                value   JSONB        NOT NULL
            );
        `);
        console.log('  ✅ settings table');

        // ── Seed Default Settings ──────────────────────────────────────────────
        const defaultSettings = {
            flashSale:    { active: false, title: "Today's Hot Deals", endTime: null, productIds: [] },
            siteSettings: { freeShippingThreshold: 999, shippingCost: 99, codAvailable: true, maintenanceMode: false },
            announcements:{ active: false, text: 'Free shipping on orders above ₹999!' },
            categories:   [
                { id: 'action-figures', label: 'Action Figures', icon: '🗡️' },
                { id: 'keychains',      label: 'Keychains',      icon: '🔑' },
                { id: 'posters',        label: 'Posters',        icon: '🖼️' },
                { id: 'clothing',       label: 'Clothing',       icon: '👕' },
                { id: 'accessories',    label: 'Accessories',    icon: '✨' },
            ]
        };

        // Check existing settings.json
        const settingsFile = path.join(__dirname, 'data', 'settings.json');
        const existingSettings = fs.existsSync(settingsFile)
            ? JSON.parse(fs.readFileSync(settingsFile, 'utf8'))
            : defaultSettings;

        for (const [key, value] of Object.entries(existingSettings)) {
            await client.query(
                `INSERT INTO settings (key, value) VALUES ($1, $2)
                 ON CONFLICT (key) DO UPDATE SET value = $2`,
                [key, JSON.stringify(value)]
            );
        }
        console.log('  ✅ settings seeded');

        // ── Seed Products from products.json ───────────────────────────────────
        const productsFile = path.join(__dirname, 'data', 'products.json');
        if (fs.existsSync(productsFile)) {
            const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
            const { rows: existingRows } = await client.query('SELECT COUNT(*) FROM products');
            if (parseInt(existingRows[0].count) === 0) {
                console.log(`\n📦 Importing ${products.length} products from products.json...`);
                for (const p of products) {
                    await client.query(
                        `INSERT INTO products
                            (id, name, category, anime, price, original_price, rating, reviews, stock, image, badge, description, tags)
                         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
                         ON CONFLICT (id) DO NOTHING`,
                        [
                            p.id, p.name, p.category || 'accessories', p.anime || '',
                            p.price || 0, p.originalPrice || 0, p.rating || 4.5,
                            p.reviews || 0, p.stock || 0, p.image || '',
                            p.badge || '', p.description || '',
                            p.tags || []
                        ]
                    );
                }
                // Reset sequence so next product ID continues from max
                await client.query(`SELECT setval('products_id_seq', (SELECT MAX(id) FROM products))`);
                console.log(`  ✅ ${products.length} products imported!`);
            } else {
                console.log(`  ⏭️  Products already in DB (${existingRows[0].count} rows) — skipping import`);
            }
        }

        // ── Migrate existing users.json ────────────────────────────────────────
        const usersFile = path.join(__dirname, 'data', 'users.json');
        if (fs.existsSync(usersFile)) {
            const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
            if (users.length > 0) {
                const { rows: existingUsers } = await client.query('SELECT COUNT(*) FROM users');
                if (parseInt(existingUsers[0].count) === 0) {
                    console.log(`\n👥 Migrating ${users.length} users from users.json...`);
                    for (const u of users) {
                        await client.query(
                            `INSERT INTO users (id, name, email, password, avatar, favorite_anime, wishlist, created_at)
                             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                             ON CONFLICT (email) DO NOTHING`,
                            [
                                u.id, u.name, u.email.toLowerCase(), u.password,
                                u.avatar || '', u.favoriteAnime || '',
                                u.wishlist || [], u.createdAt || new Date()
                            ]
                        );

                        // Migrate user's orders
                        if (u.orders && u.orders.length > 0) {
                            for (const o of u.orders) {
                                await client.query(
                                    `INSERT INTO orders (id, user_id, items, customer, total, status, source, created_at)
                                     VALUES ($1,$2,$3,$4,$5,$6,'user',$7)
                                     ON CONFLICT (id) DO NOTHING`,
                                    [o.id, u.id, JSON.stringify(o.items || []),
                                     JSON.stringify(o.customer || {}), o.total || 0,
                                     o.status || 'confirmed', o.createdAt || new Date()]
                                );
                            }
                        }
                    }
                    console.log(`  ✅ ${users.length} users migrated!`);
                } else {
                    console.log(`  ⏭️  Users already in DB — skipping migration`);
                }
            }
        }

        // ── Migrate guest orders.json ──────────────────────────────────────────
        const ordersFile = path.join(__dirname, 'data', 'orders.json');
        if (fs.existsSync(ordersFile)) {
            const orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
            if (orders.length > 0) {
                console.log(`\n🧾 Migrating ${orders.length} guest orders...`);
                for (const o of orders) {
                    await client.query(
                        `INSERT INTO orders (id, user_id, items, customer, total, status, source, created_at)
                         VALUES ($1,NULL,$2,$3,$4,$5,'guest',$6)
                         ON CONFLICT (id) DO NOTHING`,
                        [o.id, JSON.stringify(o.items || []),
                         JSON.stringify(o.customer || {}), o.total || 0,
                         o.status || 'confirmed', o.createdAt || new Date()]
                    );
                }
                console.log(`  ✅ ${orders.length} guest orders migrated!`);
            }
        }

        console.log('\n🎉 Migration complete! Your database is ready.\n');

    } catch (err) {
        console.error('\n❌ Migration failed:', err.message);
        console.error(err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
