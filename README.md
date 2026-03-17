# AnimeStore 🎌

> Your ultimate destination for premium anime merchandise!

## 🚀 Quick Start

### 1. Start the Backend (Port 5000)
```bash
cd backend
npm install
npm start
```

### 2. Start the Frontend (Port 5173)
```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## 🛍️ Features

- **30+ Anime Products** across 5 categories
- **Action Figures, Keychains, Posters, Clothing, Accessories**
- **Anime universes**: Naruto, One Piece, Dragon Ball, Demon Slayer, Attack on Titan
- 🔍 **Search & Filter** by category, anime, and keywords
- 🛒 **Cart** with quantity control + localStorage persistence
- 💳 **Checkout** with form validation and multiple payment methods
- 🎨 **Dark anime theme** with glassmorphism and neon accents

## 🏗️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| HTTP | Axios |
| Backend | Node.js + Express |
| Data | In-memory mock DB |
| Styling | Vanilla CSS (custom design system) |
| Fonts | Google Fonts (Outfit + Orbitron) |

## 📁 Structure

```
AnimeStore/
├── backend/
│   ├── server.js
│   ├── data/products.js      ← 30+ anime products
│   └── routes/
│       ├── products.js
│       └── orders.js
└── frontend/
    └── src/
        ├── context/CartContext.jsx
        ├── components/
        │   ├── Navbar, Footer, ProductCard
        │   ├── CartSidebar, Toast
        └── pages/
            ├── Home, Shop, ProductDetail
            ├── Cart, Checkout, About
```

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | All products (supports `?category=`, `?search=`, `?sort=`) |
| GET | `/api/products/featured` | Featured/hot products |
| GET | `/api/products/:id` | Single product + related |
| POST | `/api/orders` | Place an order |

---
Made with ❤️ for anime fans everywhere.
