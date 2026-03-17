import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ToastContext } from '../App';
import './CartSidebar.css';

function formatPrice(p) {
    return `₹${p.toLocaleString('en-IN')}`;
}

function getCategoryEmoji(cat) {
    const map = {
        'action-figures': '🗡️',
        'keychains': '🔑',
        'posters': '🖼️',
        'clothing': '👕',
        'accessories': '✨',
    };
    return map[cat] || '🎌';
}

export default function CartSidebar() {
    const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, count } = useCart();
    const { addToast } = useContext(ToastContext);
    const navigate = useNavigate();

    const shipping = subtotal > 999 ? 0 : 99;
    const total = subtotal + shipping;

    const handleCheckout = () => {
        closeCart();
        navigate('/checkout');
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={`cart-overlay ${isOpen ? 'open' : ''}`}
                onClick={closeCart}
                aria-hidden="true"
            />

            {/* Sidebar */}
            <aside className={`cart-sidebar ${isOpen ? 'open' : ''}`} role="dialog" aria-label="Shopping Cart">
                {/* Header */}
                <div className="cart-sidebar__header">
                    <div>
                        <h2 className="cart-sidebar__title">🛒 Your Cart</h2>
                        {count > 0 && <p className="cart-sidebar__count">{count} item{count !== 1 ? 's' : ''}</p>}
                    </div>
                    <button className="cart-sidebar__close" onClick={closeCart} id="cart-close-btn">✕</button>
                </div>

                {/* Free shipping bar */}
                {subtotal < 999 && subtotal > 0 && (
                    <div className="cart-shipping-bar">
                        <span>🚀 Add {formatPrice(999 - subtotal)} more for <strong>FREE shipping!</strong></span>
                        <div className="shipping-progress">
                            <div className="shipping-progress__fill" style={{ width: `${(subtotal / 999) * 100}%` }} />
                        </div>
                    </div>
                )}
                {subtotal >= 999 && (
                    <div className="cart-shipping-bar cart-shipping-bar--free">
                        <span>🎉 You've unlocked <strong>FREE shipping!</strong></span>
                    </div>
                )}

                {/* Items */}
                <div className="cart-sidebar__items">
                    {items.length === 0 ? (
                        <div className="cart-empty">
                            <div className="cart-empty__icon">🎌</div>
                            <p>Your cart is empty</p>
                            <Link to="/shop" className="btn btn-primary btn-sm" onClick={closeCart}>
                                Start Shopping
                            </Link>
                        </div>
                    ) : (
                        items.map(item => (
                            <div className="cart-item" key={item.id}>
                                <div className="cart-item__img">
                                    <span className="cart-item__emoji">{getCategoryEmoji(item.category)}</span>
                                </div>
                                <div className="cart-item__details">
                                    <p className="cart-item__name">{item.name}</p>
                                    <p className="cart-item__anime">{item.anime}</p>
                                    <div className="cart-item__bottom">
                                        <span className="cart-item__price">{formatPrice(item.price)}</span>
                                        <div className="cart-item__qty">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="qty-btn"
                                                aria-label="Decrease quantity"
                                            >−</button>
                                            <span className="qty-value">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, Math.min(item.stock || 99, item.quantity + 1))}
                                                className="qty-btn"
                                                aria-label="Increase quantity"
                                            >+</button>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="cart-item__remove"
                                    onClick={() => {
                                        removeItem(item.id);
                                        addToast(`Removed ${item.name}`, 'info');
                                    }}
                                    aria-label={`Remove ${item.name}`}
                                >🗑️</button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="cart-sidebar__footer">
                        <div className="cart-summary">
                            <div className="cart-summary__row">
                                <span>Subtotal</span>
                                <span>{formatPrice(subtotal)}</span>
                            </div>
                            <div className="cart-summary__row">
                                <span>Shipping</span>
                                <span>{shipping === 0 ? <span style={{ color: '#4ade80' }}>FREE</span> : formatPrice(shipping)}</span>
                            </div>
                            <div className="cart-summary__row cart-summary__row--total">
                                <span>Total</span>
                                <span className="total-amount">{formatPrice(total)}</span>
                            </div>
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            onClick={handleCheckout}
                            id="checkout-btn"
                        >
                            Checkout — {formatPrice(total)}
                        </button>
                        <Link
                            to="/cart"
                            className="btn btn-secondary btn-sm"
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={closeCart}
                        >
                            View Full Cart
                        </Link>
                    </div>
                )}
            </aside>
        </>
    );
}
