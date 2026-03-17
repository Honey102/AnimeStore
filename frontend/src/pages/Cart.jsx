import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ToastContext } from '../App';
import './Cart.css';

function formatPrice(p) { return `₹${p.toLocaleString('en-IN')}`; }

export default function Cart() {
    const { items, removeItem, updateQuantity, subtotal, count, clearCart } = useCart();
    const { addToast } = useContext(ToastContext);
    const navigate = useNavigate();

    const shipping = subtotal > 999 ? 0 : 99;
    const total = subtotal + shipping;

    const emojiMap = {
        'action-figures': '🗡️', 'keychains': '🔑',
        'posters': '🖼️', 'clothing': '👕', 'accessories': '✨'
    };

    return (
        <div className="cart-page">
            <div className="container">
                <div className="cart-page__header">
                    <h1>🛒 Your Cart</h1>
                    {items.length > 0 && (
                        <button className="btn btn-secondary btn-sm" onClick={() => {
                            clearCart();
                            addToast('Cart cleared', 'info');
                        }}>
                            Clear Cart
                        </button>
                    )}
                </div>

                {items.length === 0 ? (
                    <div className="cart-page__empty">
                        <div style={{ fontSize: '6rem' }}>🎌</div>
                        <h2>Your cart is empty!</h2>
                        <p>Looks like you haven't added any anime goodies yet.</p>
                        <Link to="/shop" className="btn btn-primary btn-lg">Start Shopping →</Link>
                    </div>
                ) : (
                    <div className="cart-page__grid">
                        {/* Items */}
                        <div className="cart-page__items">
                            {items.map(item => (
                                <div className="cart-page-item" key={item.id}>
                                    <div className="cart-page-item__img">
                                        <span>{emojiMap[item.category] || '🎌'}</span>
                                    </div>
                                    <div className="cart-page-item__details">
                                        <Link to={`/product/${item.id}`} className="cart-page-item__name">
                                            {item.name}
                                        </Link>
                                        <span className="cart-page-item__anime">{item.anime}</span>
                                        <span className="cart-page-item__cat">{item.category.replace(/-/g, ' ')}</span>
                                    </div>
                                    <div className="cart-page-item__controls">
                                        <div className="qty-control">
                                            <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                                            <span className="qty-value">{item.quantity}</span>
                                            <button className="qty-btn" onClick={() => updateQuantity(item.id, Math.min(item.stock || 99, item.quantity + 1))}>+</button>
                                        </div>
                                        <span className="cart-page-item__price">{formatPrice(item.price * item.quantity)}</span>
                                        <button
                                            className="cart-page-item__remove"
                                            onClick={() => { removeItem(item.id); addToast(`Removed "${item.name}"`, 'info'); }}
                                        >
                                            🗑️ Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="cart-page__summary">
                            <div className="summary-card">
                                <h3>Order Summary</h3>
                                <div className="summary-card__rows">
                                    <div className="summary-row">
                                        <span>Subtotal ({count} items)</span>
                                        <span>{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Shipping</span>
                                        <span>{shipping === 0 ? <span style={{ color: '#4ade80' }}>FREE</span> : formatPrice(shipping)}</span>
                                    </div>
                                    {shipping > 0 && subtotal < 999 && (
                                        <div className="summary-tip">
                                            Add {formatPrice(999 - subtotal)} more for free shipping 🚀
                                        </div>
                                    )}
                                    <div className="summary-row summary-row--total">
                                        <span>Total</span>
                                        <span className="summary-total">{formatPrice(total)}</span>
                                    </div>
                                </div>
                                <button className="btn btn-gold" style={{ width: '100%' }} onClick={() => navigate('/checkout')} id="checkout-page-btn">
                                    Proceed to Checkout →
                                </button>
                                <Link to="/shop" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                                    ← Continue Shopping
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
