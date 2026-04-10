import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import allProducts from '../data/products';
import './Home.css';

const marqueeItems = [
    { icon: '🍥', name: 'Naruto', rgb: '249,115,22' },
    { icon: '☠️', name: 'One Piece', rgb: '59,130,246' },
    { icon: '⚔️', name: 'Demon Slayer', rgb: '139,92,246' },
    { icon: '🔮', name: 'Dragon Ball', rgb: '245,158,11' },
    { icon: '🏰', name: 'Attack on Titan', rgb: '107,114,128' },
    { icon: '🌙', name: 'Bleach', rgb: '6,182,212' },
    { icon: '🤖', name: 'Evangelion', rgb: '16,185,129' },
    { icon: '💪', name: 'My Hero Academia', rgb: '239,68,68' },
    { icon: '🃏', name: 'Jujutsu Kaisen', rgb: '99,102,241' },
    { icon: '🦊', name: 'Inuyasha', rgb: '251,146,60' },
];

const categories = [
    { id: 'action-figures', label: 'Action Figures', icon: '🗡️', desc: 'Premium collectibles', color: '#e63946' },
    { id: 'keychains', label: 'Keychains', icon: '🔑', desc: 'Cute & detailed', color: '#f4a217' },
    { id: 'posters', label: 'Posters', icon: '🖼️', desc: 'Wall art', color: '#7c3aed' },
    { id: 'clothing', label: 'Clothing', icon: '👕', desc: 'Wear your fandom', color: '#0891b2' },
    { id: 'accessories', label: 'Accessories', icon: '✨', desc: 'Everyday anime', color: '#059669' },
];

const animes = [
    { name: 'Naruto', icon: '🍥', color: '#f97316' },
    { name: 'One Piece', icon: '☠️', color: '#3b82f6' },
    { name: 'Demon Slayer', icon: '⚔️', color: '#8b5cf6' },
    { name: 'Dragon Ball', icon: '🔮', color: '#f59e0b' },
    { name: 'Attack on Titan', icon: '🏰', color: '#6b7280' },
];

// ── Flash Sale Timer: persists in localStorage so it doesn't reset on page refresh ──
function getFlashSaleTarget() {
    const stored = localStorage.getItem('animestore_flash_end');
    if (stored) {
        const storedTime = parseInt(stored, 10);
        if (storedTime > Date.now()) return storedTime;
    }
    const t = new Date();
    t.setHours(23, 59, 59, 0);
    const target = t.getTime();
    localStorage.setItem('animestore_flash_end', target.toString());
    return target;
}

export default function Home() {
    const [featured, setFeatured] = useState([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        // Show top 8 products by reviews (most popular)
        const top = [...allProducts].sort((a, b) => b.reviews - a.reviews).slice(0, 8);
        setFeatured(top);
        setLoading(false);
    }, []);



    const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
    useEffect(() => {
        const target = getFlashSaleTarget();
        const tick = () => {
            const diff = target - Date.now();
            if (diff <= 0) {
                localStorage.removeItem('animestore_flash_end');
                setTimeLeft({ h: 0, m: 0, s: 0 });
                return;
            }
            setTimeLeft({
                h: Math.floor(diff / 3600000),
                m: Math.floor((diff % 3600000) / 60000),
                s: Math.floor((diff % 60000) / 1000),
            });
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    const pad = n => String(n).padStart(2, '0');

    return (
        <div className="home">

            {/* ── HERO ── */}
            <section className="hero">
                <div className="hero__bg">
                    <div className="hero__orb hero__orb--1" />
                    <div className="hero__orb hero__orb--2" />
                    <div className="hero__grid" />
                </div>
                <div className="container hero__content">
                    <div className="hero__text">
                        <div className="hero__pill">✨ 500+ Anime Products</div>
                        <h1 className="hero__title">
                            Your Ultimate<br />
                            <span className="hero__title-accent">Anime Store</span>
                        </h1>
                        <p className="hero__subtitle">
                            Premium collectibles, posters, keychains & clothing from your favourite anime series. Fast delivery across India. 🇮🇳
                        </p>
                        <div className="hero__actions">
                            <Link to="/shop" className="btn btn-primary btn-lg" id="hero-shop-btn">Shop Now →</Link>
                            <Link to="/shop?search=new" className="btn btn-gold btn-lg hero__offer-btn" id="hero-offer-btn">🔥 Today's Offers</Link>
                        </div>
                        <div className="hero__stats">
                            <div className="hero__stat">
                                <span className="hero__stat-value">500+</span>
                                <span className="hero__stat-label">Products</span>
                            </div>
                            <div className="hero__stat">
                                <span className="hero__stat-value">10K+</span>
                                <span className="hero__stat-label">Happy Fans</span>
                            </div>
                            <div className="hero__stat">
                                <span className="hero__stat-value">4.9★</span>
                                <span className="hero__stat-label">Rating</span>
                            </div>
                        </div>
                    </div>
                    <div className="hero__visual">
                        <div className="hero__panel">
                            <div className="hero__panel-glow" />
                            <Link to="/shop" className="hero__panel-center">
                                <span className="hero__panel-emoji">⛩️</span>
                                <span className="hero__panel-tagline">ANIME STORE</span>
                            </Link>
                            <Link to="/shop" className="hero__badge hero__badge--tl">
                                <span className="hero__badge-icon">⭐</span>
                                <div>
                                    <div className="hero__badge-val">4.9 / 5</div>
                                    <div className="hero__badge-key">Top Rated</div>
                                </div>
                            </Link>
                            <Link to="/shop" className="hero__badge hero__badge--tr">
                                <span className="hero__badge-icon">📦</span>
                                <div>
                                    <div className="hero__badge-val">500+</div>
                                    <div className="hero__badge-key">Products</div>
                                </div>
                            </Link>
                            <Link to="/about" className="hero__badge hero__badge--bl">
                                <span className="hero__badge-icon">🚀</span>
                                <div>
                                    <div className="hero__badge-val">24hr</div>
                                    <div className="hero__badge-key">Fast Ship</div>
                                </div>
                            </Link>
                            <Link to="/about" className="hero__badge hero__badge--br">
                                <span className="hero__badge-icon">✅</span>
                                <div>
                                    <div className="hero__badge-val">100%</div>
                                    <div className="hero__badge-key">Authentic</div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="hero__scroll">
                    <div className="scroll-dot" />
                    <span>Scroll to explore</span>
                </div>
            </section>

            {/* ── MARQUEE ── */}
            <div className="marquee-wrapper">
                <div className="marquee-strip">
                    <div className="marquee-track marquee-left">
                        {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
                            <Link
                                key={i}
                                to={`/shop?search=${encodeURIComponent(item.name)}`}
                                className="marquee-item"
                                style={{ '--item-color': `rgb(${item.rgb})` }}
                            >
                                <span className="marquee-item__icon">{item.icon}</span>
                                <span className="marquee-item__name">{item.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="marquee-strip marquee-strip--reverse">
                    <div className="marquee-track marquee-right">
                        {[...marqueeItems, ...marqueeItems, ...marqueeItems].reverse().map((item, i) => (
                            <Link
                                key={i}
                                to={`/shop?search=${encodeURIComponent(item.name)}`}
                                className="marquee-item marquee-item--outlined"
                                style={{ '--item-color': `rgb(${item.rgb})` }}
                            >
                                <span className="marquee-item__icon">{item.icon}</span>
                                <span className="marquee-item__name">{item.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── CATEGORIES ── */}
            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <div>
                            <h2 className="section-title">Browse Categories</h2>
                            <p className="section-subtitle">Find exactly what you're looking for</p>
                        </div>
                        <Link to="/shop" className="btn btn-secondary btn-sm">View All →</Link>
                    </div>
                    <div className="categories-grid">
                        {categories.map(cat => (
                            <Link to={`/shop/${cat.id}`} key={cat.id} className="category-card" id={`cat-${cat.id}`}>
                                <div className="category-card__icon" style={{ '--cat-color': cat.color }}>{cat.icon}</div>
                                <h3 className="category-card__label">{cat.label}</h3>
                                <p className="category-card__desc">{cat.desc}</p>
                                <div className="category-card__arrow">→</div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <hr className="divider" />

            {/* ── FLASH SALE ── */}
            <section className="flash-sale-section">
                <div className="container">
                    <div className="flash-sale-inner">
                        <div className="flash-sale__left">
                            <div className="flash-badge">⚡ FLASH SALE</div>
                            <h2 className="flash-sale__title">Today's Hot Deals</h2>
                            <p className="flash-sale__sub">Ends in — grab before they're gone!</p>
                            <Link to="/shop" className="btn btn-gold btn-lg" id="flash-shop-btn">Shop Deals →</Link>
                        </div>
                        <div className="flash-sale__timer">
                            <div className="timer-unit">
                                <span className="timer-digit">{pad(timeLeft.h)}</span>
                                <span className="timer-label">Hours</span>
                            </div>
                            <span className="timer-colon">:</span>
                            <div className="timer-unit">
                                <span className="timer-digit">{pad(timeLeft.m)}</span>
                                <span className="timer-label">Mins</span>
                            </div>
                            <span className="timer-colon">:</span>
                            <div className="timer-unit">
                                <span className="timer-digit">{pad(timeLeft.s)}</span>
                                <span className="timer-label">Secs</span>
                            </div>
                        </div>
                        <div className="flash-sale__offers">
                            {[
                                { icon: '🗡️', label: 'Action Figures', discount: 'Up to 20% off', path: '/shop/action-figures' },
                                { icon: '🖼️', label: 'Posters', discount: 'Buy 2 Get 1', path: '/shop/posters' },
                                { icon: '🔑', label: 'Keychains', discount: 'Min ₹199', path: '/shop/keychains' },
                            ].map(o => (
                                <Link key={o.label} to={o.path} className="flash-offer">
                                    <span className="flash-offer__icon">{o.icon}</span>
                                    <div>
                                        <div className="flash-offer__label">{o.label}</div>
                                        <div className="flash-offer__discount">{o.discount}</div>
                                    </div>
                                    <span className="flash-offer__arrow">→</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

            </section>
            <hr className="divider" />

            {/* ── FEATURED PRODUCTS (no heading) ── */}
            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <div />
                        <Link to="/shop" className="btn btn-secondary btn-sm">See All →</Link>
                    </div>
                    {loading ? (
                        <div className="spinner-wrapper">
                            <div className="spinner" />
                        </div>
                    ) : (
                        <div className="products-grid">
                            {featured.map(p => <ProductCard key={p.id} product={p} />)}
                        </div>
                    )}
                </div>
            </section>

            <hr className="divider" />

            {/* ── ANIME UNIVERSE ── */}

            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <div>
                            <h2 className="section-title">Anime Universe</h2>
                            <p className="section-subtitle">Shop by your favourite series</p>
                        </div>
                    </div>
                    <div className="anime-grid">
                        {animes.map(a => (
                            <Link
                                key={a.name}
                                to={`/shop?search=${encodeURIComponent(a.name)}`}
                                className="anime-card"
                                style={{ '--anime-color': a.color }}
                                id={`anime-${a.name.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                                <span className="anime-card__icon">{a.icon}</span>
                                <span className="anime-card__name">{a.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── WHY CHOOSE US ── */}
            <section className="section features-section">
                <div className="container">
                    <div className="features-grid">
                        {[
                            { icon: '🚀', title: 'Fast Delivery', desc: 'Ships within 24hrs. Delivered in 3-7 business days across India.' },
                            { icon: '✅', title: '100% Authentic', desc: 'All products are officially licensed or premium quality imports.' },
                            { icon: '🔒', title: 'Secure Payment', desc: 'SSL encrypted checkout. Pay with UPI, cards, wallets & more.' },
                            { icon: '↩️', title: '7-Day Returns', desc: 'Not happy? Return within 7 days for a full refund.' },
                        ].map(f => (
                            <div key={f.title} className="feature-card">
                                <div className="feature-card__icon">{f.icon}</div>
                                <h4 className="feature-card__title">{f.title}</h4>
                                <p className="feature-card__desc">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
