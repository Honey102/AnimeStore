import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ToastContext } from '../App';
import './Checkout.css';

function formatPrice(p) { return `₹${p.toLocaleString('en-IN')}`; }

export default function Checkout() {
    const { items, subtotal, clearCart } = useCart();
    const { user } = useAuth();
    const { addToast } = useContext(ToastContext);
    const navigate = useNavigate();
    const [placing, setPlacing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [orderId, setOrderId] = useState('');

    const shipping = subtotal > 999 ? 0 : 99;
    const total = subtotal + shipping;

    // ✅ Fix: Agar cart empty hai aur user /checkout pe directly aaya — shop pe bhejo
    useEffect(() => {
        if (!success && items.length === 0) {
            navigate('/shop', { replace: true });
        }
    }, [items.length, success, navigate]);


    const [form, setForm] = useState({
        name: user?.name || '', email: user?.email || '', phone: '',
        address: '', city: '', state: '', pincode: '',
        paymentMethod: 'upi',
        upiId: '', cardNumber: '', cardExpiry: '', cardCvv: '', bankName: ''
    });

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    // Auto-format card number as groups of 4: 1234 5678 9012 3456
    const handleCardNumber = (e) => {
        const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
        const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
        setForm(f => ({ ...f, cardNumber: formatted }));
    };

    // Auto-insert slash for expiry: MM/YY
    const handleCardExpiry = (e) => {
        let val = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2);
        setForm(f => ({ ...f, cardExpiry: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!items.length) return;
        setPlacing(true);
        try {
            let res;
            if (user) {
                res = await axios.post('/api/auth/orders', { items, customer: form, total });
            } else {
                res = await axios.post('/api/orders', { items, customer: form, total });
            }
            const id = res.data.order.id;
            clearCart();
            addToast('Order placed successfully! 🎌', 'success');

            // ✅ Fix: Replace /checkout in browser history so Back button skips it
            // User can never accidentally go back to checkout after placing order
            window.history.replaceState(null, '', '/');
            setOrderId(id);
            setSuccess(true);
        } catch {
            // Offline fallback
            const fallbackOrder = {
                id: `ORD-${Date.now()}`,
                items, total, customer: form,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            try {
                const existing = JSON.parse(localStorage.getItem('animestore_offline_orders') || '[]');
                localStorage.setItem('animestore_offline_orders', JSON.stringify([fallbackOrder, ...existing]));
                clearCart();
                addToast('Order saved locally! (Server offline) 📦', 'info');
                window.history.replaceState(null, '', '/');
                setOrderId(fallbackOrder.id);
                setSuccess(true);
            } catch {
                addToast('Something went wrong. Please try again!', 'error');
            }
        } finally {
            setPlacing(false);
        }
    };

    if (success) {
        return (
            <div className="checkout-success">
                <div className="success-card">
                    <div className="success-icon">🎉</div>
                    <h1>Order Placed!</h1>
                    <p className="success-order-id">Order ID: <strong>{orderId}</strong></p>
                    <p>Your anime goodies are on their way! 🚀<br />You'll receive a confirmation shortly.</p>
                    <div className="success-actions">
                        {/* ✅ Fix: Use navigate with replace so back button goes to home, not checkout */}
                        <button className="btn btn-primary btn-lg" onClick={() => navigate('/shop', { replace: true })}>
                            Continue Shopping
                        </button>
                        <button className="btn btn-secondary" onClick={() => navigate('/profile', { replace: true, state: { tab: 'orders' } })}>
                            📦 View My Orders
                        </button>
                        <button className="btn btn-secondary" onClick={() => navigate('/', { replace: true })}>
                            Go to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ✅ Fix: Empty cart pe checkout ka static fallback — useEffect se redirect hoga
    // Yeh sirf tab dikhega jab briefly items.length check ho raha ho
    if (!items.length) return null;

    return (
        <div className="checkout-page">
            <div className="container">
                <h1 className="checkout__title">Secure Checkout 🔒</h1>
                <div className="checkout-grid">
                    {/* Form */}
                    <form className="checkout-form" onSubmit={handleSubmit}>
                        <div className="checkout-section">
                            <h3>Delivery Information</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="name">Full Name *</label>
                                    <input id="name" name="name" type="text" required placeholder="Your full name" value={form.name} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Email *</label>
                                    <input id="email" name="email" type="email" required placeholder="your@email.com" value={form.email} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="phone">Phone Number *</label>
                                <input id="phone" name="phone" type="tel" required placeholder="98765 43210" value={form.phone} onChange={handleChange} pattern="[0-9]{10}" title="Enter a valid 10-digit phone number" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="address">Address *</label>
                                <input id="address" name="address" type="text" required placeholder="Street, Building, Area" value={form.address} onChange={handleChange} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="city">City *</label>
                                    <input id="city" name="city" type="text" required placeholder="Mumbai" value={form.city} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="state">State *</label>
                                    <input id="state" name="state" type="text" required placeholder="Maharashtra" value={form.state} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="pincode">Pincode *</label>
                                    <input id="pincode" name="pincode" type="text" required placeholder="400001" maxLength="6" value={form.pincode} onChange={handleChange} pattern="[0-9]{6}" title="Enter a valid 6-digit pincode" />
                                </div>
                            </div>
                        </div>

                        <div className="checkout-section">
                            <h3>Payment Method</h3>
                            <div className="payment-options">
                                {[
                                    { value: 'upi', label: 'UPI / QR', icon: '📱' },
                                    { value: 'card', label: 'Credit / Debit Card', icon: '💳' },
                                    { value: 'netbanking', label: 'Net Banking', icon: '🏦' },
                                    { value: 'cod', label: 'Cash on Delivery', icon: '💰' },
                                ].map(m => (
                                    <label key={m.value} className={`payment-option ${form.paymentMethod === m.value ? 'active' : ''}`}>
                                        <input type="radio" name="paymentMethod" value={m.value} checked={form.paymentMethod === m.value} onChange={handleChange} />
                                        <span>{m.icon}</span>
                                        <span>{m.label}</span>
                                    </label>
                                ))}
                            </div>

                            {/* UPI Details */}
                            {form.paymentMethod === 'upi' && (
                                <div className="form-group" style={{ marginTop: '1rem' }}>
                                    <label htmlFor="upiId">UPI ID *</label>
                                    <input
                                        id="upiId" name="upiId" type="text" required
                                        placeholder="yourname@upi"
                                        value={form.upiId} onChange={handleChange}
                                        pattern="[a-zA-Z0-9._-]+@[a-zA-Z0-9]+"
                                        title="Enter a valid UPI ID (e.g. name@upi)"
                                    />
                                </div>
                            )}

                            {/* Card Details */}
                            {form.paymentMethod === 'card' && (
                                <div style={{ marginTop: '1rem' }}>
                                    <div className="form-group">
                                        <label htmlFor="cardNumber">Card Number *</label>
                                        <input
                                            id="cardNumber" name="cardNumber" type="text" required
                                            placeholder="1234 5678 9012 3456"
                                            value={form.cardNumber}
                                            onChange={handleCardNumber}
                                            maxLength="19"
                                            inputMode="numeric"
                                            title="Enter a valid 16-digit card number"
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="cardExpiry">Expiry (MM/YY) *</label>
                                            <input
                                                id="cardExpiry" name="cardExpiry" type="text" required
                                                placeholder="MM/YY"
                                                value={form.cardExpiry}
                                                onChange={handleCardExpiry}
                                                maxLength="5"
                                                inputMode="numeric"
                                                title="Enter expiry in MM/YY format"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="cardCvv">CVV *</label>
                                            <input
                                                id="cardCvv" name="cardCvv" type="password" required
                                                placeholder="123"
                                                value={form.cardCvv} onChange={handleChange}
                                                maxLength="4"
                                                pattern="[0-9]{3,4}"
                                                title="Enter 3 or 4 digit CVV"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Net Banking */}
                            {form.paymentMethod === 'netbanking' && (
                                <div className="form-group" style={{ marginTop: '1rem' }}>
                                    <label htmlFor="bankName">Select Bank *</label>
                                    <select id="bankName" name="bankName" required value={form.bankName} onChange={handleChange}
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                                    >
                                        <option value="">-- Select Bank --</option>
                                        {['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'PNB', 'Bank of Baroda', 'Canara Bank'].map(b => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* COD note */}
                            {form.paymentMethod === 'cod' && (
                                <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    💰 Pay in cash when your order is delivered.
                                </div>
                            )}
                        </div>

                        <button type="submit" className="btn btn-gold btn-lg" style={{ width: '100%' }} disabled={placing} id="place-order-btn">
                            {placing ? 'Placing Order...' : `Place Order — ${formatPrice(total)}`}
                        </button>
                    </form>

                    {/* Order review */}
                    <div className="checkout-review">
                        <div className="review-card">
                            <h3>Order Review</h3>
                            <div className="review-items">
                                {items.map(item => (
                                    <div className="review-item" key={item.id}>
                                        <span className="review-item__qty">{item.quantity}×</span>
                                        <span className="review-item__name">{item.name}</span>
                                        <span className="review-item__price">{formatPrice(item.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="review-summary">
                                <div className="summary-row">
                                    <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Shipping</span>
                                    <span>{shipping === 0 ? <span style={{ color: '#4ade80' }}>FREE</span> : formatPrice(shipping)}</span>
                                </div>
                                <div className="summary-row" style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                                    <span>Total</span><span style={{ color: 'var(--accent-gold)' }}>{formatPrice(total)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="trust-banner">
                            <div>🔒 SSL Encrypted</div>
                            <div>✅ Secure Checkout</div>
                            <div>↩️ Easy Returns</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
