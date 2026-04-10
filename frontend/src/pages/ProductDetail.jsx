import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ToastContext } from '../App';
import ProductCard from '../components/ProductCard';
import './ProductDetail.css';

function formatPrice(p) { return `₹${p.toLocaleString('en-IN')}`; }

const categoryColors = {
    'action-figures': { bg: '#e63946', glow: 'rgba(230,57,70,0.35)', emoji: '🗡️' },
    'keychains': { bg: '#f4a217', glow: 'rgba(244,162,23,0.35)', emoji: '🔑' },
    'posters': { bg: '#7c3aed', glow: 'rgba(124,58,237,0.35)', emoji: '🖼️' },
    'clothing': { bg: '#2563eb', glow: 'rgba(37,99,235,0.35)', emoji: '👕' },
    'accessories': { bg: '#10b981', glow: 'rgba(16,185,129,0.35)', emoji: '✨' },
};

const TABS = ['Description', 'Details', 'Reviews'];

export default function ProductDetail() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);
    const [activeTab, setActiveTab] = useState('Description');
    const [activeThumb, setActiveThumb] = useState(0);
    const [zoomed, setZoomed] = useState(false);
    const { addItem } = useCart();
    const { user, isWishlisted, toggleWishlist } = useAuth();
    const { addToast } = useContext(ToastContext);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        setAdded(false);
        setQty(1);
        setActiveTab('Description');
        setActiveThumb(0);
        fetch('/api/products')
            .then(r => r.json())
            .then(data => {
                const all = data.products || [];
                const found = all.find(p => p.id === parseInt(id));
                if (!found) { navigate('/shop'); return; }
                setProduct(found);
                const rel = all.filter(p => p.category === found.category && p.id !== found.id).slice(0, 4);
                setRelated(rel);
            })
            .catch(() => navigate('/shop'))
            .finally(() => setLoading(false));
    }, [id, navigate]);

    if (loading) return (
        <div className="pd-loading-screen">
            <div className="pd-loader">
                <div className="pd-loader-ring"></div>
                <div className="pd-loader-ring"></div>
                <div className="pd-loader-ring"></div>
            </div>
            <p className="pd-loading-text">Loading product...</p>
        </div>
    );
    if (!product) return null;

    const cat = categoryColors[product.category] || { bg: '#e63946', glow: 'rgba(230,57,70,0.35)', emoji: '🎌' };
    const discount = product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;
    const stars = product.rating;
    const fullStars = Math.floor(stars);
    const hasHalf = stars % 1 >= 0.5;

    const handleAddToCart = () => {
        for (let i = 0; i < qty; i++) addItem(product);
        setAdded(true);
        addToast(`${product.name} ×${qty} added to cart! 🛒`, 'success');
        setTimeout(() => setAdded(false), 2500);
    };

    const handleBuyNow = () => {
        for (let i = 0; i < qty; i++) addItem(product);
        navigate('/checkout');
    };

    const handleWishlist = async () => {
        if (!user) {
            addToast('Please login to use wishlist! 🔑', 'error');
            navigate('/login', { state: { from: `/product/${id}` } });
            return;
        }
        const res = await toggleWishlist(product.id);
        if (res) addToast(res.message, res.wishlisted ? 'success' : 'info');
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({ title: product.name, text: `Check out ${product.name} on AnimeStore!`, url });
            } catch { /* user cancelled */ }
        } else {
            await navigator.clipboard.writeText(url);
            addToast('Link copied to clipboard! 📋', 'success');
        }
    };

    const handleCompare = () => {
        addToast('Compare feature coming soon! 🔜', 'info');
    };

    const thumbVariants = [cat.emoji, '📸', '🔎', '🎁'];

    return (
        <div className="product-detail">
            {/* Breadcrumb */}
            <div className="pd-breadcrumb-bar">
                <div className="container">
                    <nav className="pd-breadcrumb">
                        <Link to="/">Home</Link>
                        <span className="pd-bc-sep">›</span>
                        <Link to="/shop">Shop</Link>
                        <span className="pd-bc-sep">›</span>
                        <Link to={`/shop/${product.category}`}>{product.category.replace(/-/g, ' ')}</Link>
                        <span className="pd-bc-sep">›</span>
                        <span className="pd-bc-current">{product.name}</span>
                    </nav>
                </div>
            </div>

            <div className="container">
                <div className="pd-grid">
                    {/* ── LEFT: Image Gallery ── */}
                    <div className="pd-gallery">
                        {/* Main image */}
                        <div
                            className={`pd-main-image ${zoomed ? 'zoomed' : ''}`}
                            style={{ '--cat-glow': cat.glow, '--cat-bg': cat.bg }}
                            onMouseEnter={() => setZoomed(true)}
                            onMouseLeave={() => setZoomed(false)}
                        >
                            <div className="pd-image-glow" style={{ background: cat.glow }} />
                            <div className="pd-image-rings">
                                <div className="pd-ring pd-ring-1" style={{ borderColor: cat.bg + '33' }} />
                                <div className="pd-ring pd-ring-2" style={{ borderColor: cat.bg + '22' }} />
                            </div>
                            <span className="pd-main-emoji" style={{ filter: `drop-shadow(0 0 30px ${cat.glow})` }}>
                                {thumbVariants[activeThumb]}
                            </span>
                            {product.badge && (
                                <span className={`pd-badge badge badge-${product.badge.toLowerCase()}`}>
                                    {product.badge}
                                </span>
                            )}

                        </div>

                        {/* Thumbnails */}
                        <div className="pd-thumbs">
                            {thumbVariants.map((icon, i) => (
                                <button
                                    key={i}
                                    className={`pd-thumb ${activeThumb === i ? 'active' : ''}`}
                                    onClick={() => setActiveThumb(i)}
                                    style={activeThumb === i ? { borderColor: cat.bg, boxShadow: `0 0 12px ${cat.glow}` } : {}}
                                >
                                    <span>{icon}</span>
                                </button>
                            ))}
                        </div>

                        {/* Share & Wishlist */}
                        <div className="pd-quick-actions">
                            <button
                                className={`pd-qa-btn ${isWishlisted(product.id) ? 'pd-qa-btn--active' : ''}`}
                                title={isWishlisted(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                                onClick={handleWishlist}
                            >
                                {isWishlisted(product.id) ? '❤️ Wishlisted' : '♡ Wishlist'}
                            </button>
                            <button className="pd-qa-btn" title="Share" onClick={handleShare}>↗ Share</button>
                            <button className="pd-qa-btn" title="Compare" onClick={handleCompare}>⇌ Compare</button>
                        </div>
                    </div>

                    {/* ── RIGHT: Product Info ── */}
                    <div className="pd-info">
                        {/* Anime tag + Category */}
                        <div className="pd-meta-row">
                            <span className="pd-anime-tag" style={{ borderColor: cat.bg + '66', color: cat.bg, background: cat.bg + '15' }}>
                                {product.anime}
                            </span>
                            <span className="pd-category-tag">{product.category.replace(/-/g, ' ')}</span>
                        </div>

                        <h1 className="pd-name">{product.name}</h1>

                        {/* Rating */}
                        <div className="pd-rating-row">
                            <div className="pd-stars">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className={`pd-star ${i < fullStars ? 'full' : i === fullStars && hasHalf ? 'half' : 'empty'}`}>
                                        {i < fullStars ? '★' : i === fullStars && hasHalf ? '⯨' : '☆'}
                                    </span>
                                ))}
                            </div>
                            <span className="pd-rating-num">{product.rating}</span>
                            <span className="pd-rating-sep">•</span>
                            <span
                                className="pd-reviews-link"
                                onClick={() => {
                                    setActiveTab('Reviews');
                                    document.getElementById('pd-tabs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                            >{product.reviews.toLocaleString()} reviews</span>
                        </div>

                        {/* Price block */}
                        <div className="pd-price-block">
                            <div className="pd-price-row">
                                <span className="pd-price-current">{formatPrice(product.price)}</span>
                                <span className="pd-price-original">{formatPrice(product.originalPrice)}</span>
                                <span className="pd-discount-pill">-{discount}% OFF</span>
                            </div>
                            <div className="pd-savings-text">
                                🎉 You save <strong>{formatPrice(product.originalPrice - product.price)}</strong>!
                            </div>
                        </div>

                        {/* Stock indicator */}
                        <div className={`pd-stock-bar ${product.stock <= 5 ? 'low' : 'good'}`}>
                            <div className="pd-stock-dot" />
                            <span>
                                {product.stock <= 5
                                    ? `⚡ Only ${product.stock} left! Order soon`
                                    : `✅ In Stock — ${product.stock} units available`
                                }
                            </span>
                            {product.stock <= 10 && (
                                <div className="pd-stock-progress">
                                    <div
                                        className="pd-stock-fill"
                                        style={{ width: `${(product.stock / 20) * 100}%`, background: product.stock <= 5 ? '#e63946' : '#f4a217' }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Quantity selector */}
                        <div className="pd-qty-block">
                            <span className="pd-qty-label">Quantity</span>
                            <div className="pd-qty-controls">
                                <button className="pd-qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                                <span className="pd-qty-value">{qty}</span>
                                <button className="pd-qty-btn" onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
                            </div>
                            <span className="pd-qty-max">Max: {product.stock}</span>
                        </div>

                        {/* CTA Buttons */}
                        <div className="pd-cta">
                            <button
                                className={`pd-btn-cart ${added ? 'added' : ''}`}
                                onClick={handleAddToCart}
                                id="add-to-cart-detail"
                                disabled={added || product.stock <= 0}
                            >
                                <span className="pd-btn-icon">{product.stock <= 0 ? '❌' : added ? '✅' : '🛒'}</span>
                                <span>{product.stock <= 0 ? 'Out of Stock' : added ? 'Added to Cart!' : 'Add to Cart'}</span>
                            </button>
                            <button
                                className="pd-btn-buy"
                                onClick={handleBuyNow}
                                id="buy-now-btn"
                                disabled={product.stock <= 0}
                                style={{ background: product.stock <= 0 ? 'var(--bg-card)' : `linear-gradient(135deg, ${cat.bg}, ${cat.bg}cc)` }}
                            >
                                <span className="pd-btn-icon">{product.stock <= 0 ? '❌' : '⚡'}</span>
                                <span>{product.stock <= 0 ? 'Unavailable' : 'Buy Now'}</span>
                            </button>
                        </div>

                        {/* Trust badges */}
                        <div className="pd-trust-grid">
                            {[
                                { icon: '🚀', label: 'Fast Delivery', sub: '2-5 days' },
                                { icon: '✅', label: 'Authentic', sub: '100% genuine' },
                                { icon: '↩️', label: 'Easy Returns', sub: '7-day policy' },
                                { icon: '🔒', label: 'Secure Pay', sub: 'Encrypted' },
                            ].map(b => (
                                <div key={b.label} className="pd-trust-card">
                                    <span className="pd-trust-icon">{b.icon}</span>
                                    <div>
                                        <div className="pd-trust-label">{b.label}</div>
                                        <div className="pd-trust-sub">{b.sub}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Tags */}
                        <div className="pd-tags">
                            {product.tags.map(tag => (
                                <span key={tag} className="pd-tag">#{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Tabs Section ── */}
                <div className="pd-tabs-section" id="pd-tabs-section">
                    <div className="pd-tabs-nav">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                className={`pd-tab-btn ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                                style={activeTab === tab ? { color: cat.bg, borderBottomColor: cat.bg } : {}}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="pd-tab-content">
                        {activeTab === 'Description' && (
                            <div className="pd-tab-desc">
                                <p>{product.description}</p>
                                <ul className="pd-feature-list">
                                    <li>✦ Official licensed merchandise</li>
                                    <li>✦ Premium quality materials</li>
                                    <li>✦ Gift-ready packaging included</li>
                                    <li>✦ Collector's edition item</li>
                                </ul>
                            </div>
                        )}
                        {activeTab === 'Details' && (
                            <div className="pd-tab-details">
                                <table className="pd-details-table">
                                    <tbody>
                                        <tr><td>Category</td><td>{product.category.replace(/-/g, ' ')}</td></tr>
                                        <tr><td>Anime Series</td><td>{product.anime}</td></tr>
                                        <tr><td>SKU</td><td>ANM-{String(product.id).padStart(4, '0')}</td></tr>
                                        <tr><td>Availability</td><td>{product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}</td></tr>
                                        <tr><td>Material</td><td>Premium Grade</td></tr>
                                        <tr><td>Packaging</td><td>Gift Box</td></tr>
                                        <tr><td>Warranty</td><td>30-day quality guarantee</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {activeTab === 'Reviews' && (
                            <div className="pd-tab-reviews">
                                <div className="pd-review-summary">
                                    <div className="pd-review-big-score">
                                        <span className="pd-score-num">{product.rating}</span>
                                        <div className="pd-score-stars">
                                            {'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5 - Math.floor(product.rating))}
                                        </div>
                                        <span className="pd-score-count">{product.reviews.toLocaleString()} reviews</span>
                                    </div>
                                    <div className="pd-review-bars">
                                        {[5, 4, 3, 2, 1].map((n, i) => {
                                            const widths = [70, 20, 6, 3, 1];
                                            return (
                                                <div key={n} className="pd-review-bar-row">
                                                    <span>{n}★</span>
                                                    <div className="pd-rbar-track">
                                                        <div className="pd-rbar-fill" style={{ width: `${widths[i]}%`, background: cat.bg }} />
                                                    </div>
                                                    <span>{widths[i]}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="pd-review-sample">
                                    {[
                                        { user: 'Rahul M.', stars: 5, text: 'Amazing quality! Exactly as described. Packaging was secure and delivery was fast.', date: '2 days ago' },
                                        { user: 'Priya K.', stars: 5, text: 'Perfect gift for my anime-loving brother! He absolutely loved it. Will order more.', date: '1 week ago' },
                                        { user: 'Arjun S.', stars: 4, text: 'Great product, very detailed. Slightly smaller than expected but worth the price.', date: '2 weeks ago' },
                                    ].map((r, i) => (
                                        <div key={i} className="pd-review-card">
                                            <div className="pd-review-header">
                                                <div className="pd-reviewer-avatar">{r.user[0]}</div>
                                                <div>
                                                    <div className="pd-reviewer-name">{r.user}</div>
                                                    <div className="pd-reviewer-stars">{'★'.repeat(r.stars)}</div>
                                                </div>
                                                <span className="pd-review-date">{r.date}</span>
                                            </div>
                                            <p className="pd-review-text">{r.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Related Products ── */}
                {related.length > 0 && (
                    <section className="pd-related">
                        <div className="section-header">
                            <h2 className="section-title">You May Also Like</h2>
                        </div>
                        <div className="products-grid">
                            {related.map(p => <ProductCard key={p.id} product={p} />)}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
