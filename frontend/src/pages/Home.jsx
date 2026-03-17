import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import './Home.css';



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

export default function Home() {
    const [featured, setFeatured] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/products/featured')
            .then(r => setFeatured(r.data.products))
            .catch(() => setFeatured([]))
            .finally(() => setLoading(false));
    }, []);


    // ── Countdown Timer (24h sale) ──
    const getTarget = () => {
        const t = new Date();
        t.setHours(23, 59, 59, 0);
        return t;
    };
    const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
    useEffect(() => {
        const tick = () => {
            const diff = getTarget() - Date.now();
            if (diff <= 0) return;
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
                        <div className="hero__pill">🎌 Premium Anime Merchandise</div>
                        <h1 className="hero__title">
                            Your World.<br />
                            <span className="hero__title-accent">Your Anime.</span>
                        </h1>
                        <p className="hero__subtitle">
                            Discover thousands of authentic anime collectibles — action figures, posters,
                            keychains, clothing and more. From Naruto to One Piece, we've got it all!
                        </p>
                        <div className="hero__actions">
                            <Link to="/shop" className="btn btn-primary btn-lg" id="shop-now-btn">
                                🛒 Shop Now
                            </Link>
                            <Link to="/shop" className="btn btn-gold btn-lg hero__offer-btn" id="flash-deal-btn">
                                ⚡ Flash Deals — Up to 20% Off
                            </Link>
                        </div>
                        <div className="hero__stats">
                            {[
                                { value: '30+', label: 'Products' },
                                { value: '5', label: 'Categories' },
                                { value: '10K+', label: 'Happy Fans' },
                                { value: '4.8★', label: 'Avg Rating' },
                            ].map(s => (
                                <div key={s.label} className="hero__stat">
                                    <span className="hero__stat-value">{s.value}</span>
                                    <span className="hero__stat-label">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="hero__visual">
                        <div className="hero__float-cards">
                            {[
                                { icon: '🗡️', label: 'Action Figures', color: '#e63946', path: '/shop/action-figures', pos: 1 },
                                { icon: '🔮', label: 'Accessories', color: '#7c3aed', path: '/shop/accessories', pos: 2 },
                                { icon: '⚔️', label: 'Demon Slayer', color: '#8b5cf6', path: '/shop?search=Demon+Slayer', pos: 3 },
                                { icon: '🍥', label: 'Naruto', color: '#f97316', path: '/shop?search=Naruto', pos: 4 },
                                { icon: '☠️', label: 'One Piece', color: '#3b82f6', path: '/shop?search=One+Piece', pos: 5 },
                            ].map((card) => (
                                <Link
                                    key={card.label}
                                    to={card.path}
                                    className={`hero__float-card hero__float-card--${card.pos}`}
                                    style={{ '--card-color': card.color }}
                                >
                                    <span className="hero__float-icon">{card.icon}</span>
                                    <span className="hero__float-label">{card.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
                {/* Scroll indicator */}
                <div className="hero__scroll">
                    <div className="scroll-dot" />
                    <span>Scroll to explore</span>
                </div>
            </section>

            {/* ── MARQUEE ── */}
            <div className="marquee-wrapper">
                {/* Row 1: left scroll */}
                <div className="marquee-strip">
                    <div className="marquee-track marquee-left">
                        {[...animes, ...animes, ...animes].map((a, i) => (
                            <Link
                                key={i}
                                to={`/shop?search=${encodeURIComponent(a.name)}`}
                                className="marquee-item"
                                style={{ '--item-color': a.color }}
                            >
                                <span className="marquee-item__icon">{a.icon}</span>
                                <span className="marquee-item__name">{a.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
                {/* Row 2: right scroll */}
                <div className="marquee-strip marquee-strip--reverse">
                    <div className="marquee-track marquee-right">
                        {[...animes, ...animes, ...animes].reverse().map((a, i) => (
                            <Link
                                key={i}
                                to={`/shop?search=${encodeURIComponent(a.name)}`}
                                className="marquee-item marquee-item--outlined"
                                style={{ '--item-color': a.color }}
                            >
                                <span className="marquee-item__icon">{a.icon}</span>
                                <span className="marquee-item__name">{a.name}</span>
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
                                id={`anime-${a.name.toLowerCase().replace(' ', '-')}`}
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
