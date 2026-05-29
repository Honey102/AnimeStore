require('dotenv').config();
const express = require('express');
const cors = require('cors');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const { router: authRouter } = require('./routes/auth');
const adminRouter = require('./routes/admin');
require('./db'); // Initialize PostgreSQL connection on startup

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed origins: local dev + production Vercel URL
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://anime-store-zeta-one.vercel.app', // hardcoded production URL
  process.env.FRONTEND_URL,          // optional override via env
].filter(Boolean);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Render health checks, etc.)
    if (!origin) return callback(null, true);
    // Allow any vercel.app preview URL automatically
    if (origin.endsWith('.vercel.app') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Routes
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AnimeStore API is running 🎌' });
});

app.listen(PORT, () => {
  console.log(`\n🎌 AnimeStore Backend running on http://localhost:${PORT}`);
  console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
  console.log(`🔐 Admin API:    http://localhost:${PORT}/api/admin`);
  console.log(`✅ Health Check: http://localhost:${PORT}/api/health\n`);
  if (!process.env.ADMIN_PASSWORD) {
    console.warn('⚠️  ADMIN_PASSWORD not set in .env — using default: admin@animestore123');
  }
});
