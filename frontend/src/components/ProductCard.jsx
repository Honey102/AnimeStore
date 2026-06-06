import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ToastContext } from '../App';
import './ProductCard.css';

function formatPrice(p) {
    return `₹${p.toLocaleString('en-IN')}`;
}

function getDiscount(orig, curr) {
    return Math.round(((orig - curr) / orig) * 100);
}

function getBadgeClass(badge) {
    const map = { 'Hot': 'hot', 'Bestseller': 'bestseller', 'New': 'new', 'Limited': 'limited' };
    return map[badge] || '';
}

export default function ProductCard({ product }) {
    const { addItem } = useCart();
    const { user, isWishlisted, toggleWishlist } = useAuth();
    const { addToast } = useContext(ToastContext);

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.stock <= 0) return;
        addItem(product);
        addToast(`${product.name} added to cart! 🛒`, 'success');
    };

    const handleWishlist = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            addToast('Please login to use wishlist! 🔑', 'error');
            return;
        }
        try {
            const res = await toggleWishlist(product.id);
            if (res) {
                addToast(res.message, res.wishlisted ? 'success' : 'info');
            }
        } catch {
            addToast('Could not update wishlist. Check your connection.', 'error');
        }
    };

    const emojiMap = {
        'action-figures': '🗡️', 'keychains': '🔑',
        'posters': '🖼️', 'clothing': '👕', 'accessories': '✨'
    };

    const discount = getDiscount(product.originalPrice, product.price);
    const stars = '★'.repeat(Math.floor(product.rating)) + (product.rating % 1 >= 0.5 ? '½' : '');
    const wishlisted = isWishlisted(product.id);

    return (
        <Link to={`/product/${product.id}`} className="product-card" id={`product-${product.id}`}>
            {/* Image area */}
            <div className="product-card__image">
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.name}
                        className="product-card__img"
                        loading="lazy"
                        decoding="async"
                        onError={e => { e.target.style.display = 'none'; }}
                    />
                ) : null}
                <div className="product-card__emoji">{emojiMap[product.category] || '🎌'}</div>
                <div className="product-card__anime-badge">{product.anime}</div>

                {product.badge && (
                    <span className={`product-card__badge badge badge-${getBadgeClass(product.badge)}`}>
                        {product.badge}
                    </span>
                )}

                {/* Wishlist heart */}
                <button
                    className={`product-card__wishlist-btn ${wishlisted ? 'wishlisted' : ''}`}
                    onClick={handleWishlist}
                    id={`wishlist-${product.id}`}
                    title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                    {wishlisted ? '❤️' : '🤍'}
                </button>

                {/* Quick add overlay */}
                <div className="product-card__overlay">
                    <button
                        className="btn btn-primary btn-sm product-card__add-btn"
                        onClick={handleAddToCart}
                        id={`add-to-cart-${product.id}`}
                        disabled={product.stock <= 0}
                    >
                        {product.stock <= 0 ? '❌ Out of Stock' : '🛒 Add to Cart'}
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="product-card__info">
                <p className="product-card__name">{product.name}</p>

                <div className="product-card__rating">
                    <span className="stars">{stars}</span>
                    <span className="rating-value">{product.rating}</span>
                    <span className="rating-count">({product.reviews.toLocaleString()})</span>
                </div>

                <div className="price-container">
                    <span className="price-current">{formatPrice(product.price)}</span>
                    <span className="price-original">{formatPrice(product.originalPrice)}</span>
                    <span className="price-discount">-{discount}%</span>
                </div>

                {product.stock <= 0 ? (
                    <p className="product-card__stock out-of-stock">❌ Out of Stock</p>
                ) : product.stock <= 5 && (
                    <p className="product-card__stock">⚡ Only {product.stock} left!</p>
                )}
            </div>
        </Link>
    );
}
