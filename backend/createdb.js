/**
 * Run this ONCE to create the 'animestore' database.
 * Usage: node createdb.js
 */
require('dotenv').config();
const { Client } = require('pg');

async function createDatabase() {
    // Connect to default 'postgres' database first
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: process.env.PG_PASSWORD || 'postgres',
        database: 'postgres',
    });

    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL');

        // Check if database already exists
        const result = await client.query(
            `SELECT 1 FROM pg_database WHERE datname = 'animestore'`
        );

        if (result.rows.length > 0) {
            console.log('ℹ️  Database "animestore" already exists — skipping creation.');
        } else {
            await client.query('CREATE DATABASE animestore');
            console.log('✅ Database "animestore" created successfully!');
        }

        console.log('\n🎌 Now run: npm run migrate --prefix backend');
        console.log('   This will create all tables and import your products.\n');
    } catch (err) {
        console.error('❌ Error:', err.message);
        if (err.message.includes('password')) {
            console.error('   → Check PG_PASSWORD in your .env file');
        }
    } finally {
        await client.end();
    }
}

createDatabase();
