import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ToastContext } from '../App';
import ProductCard from '../components/ProductCard';
import './Profile.css';

function formatPrice(p) { return `₹${p.toLocaleString('en-IN')}`; }
function formatDate(d) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TABS = [
    { id: 'overview', label: '👤 Overview', },
    { id: 'orders', label: '📦 Orders' },
    { id: 'wishlist', label: '❤️ Wishlist' },
    { id: 'settings', label: '⚙️ Settings' },
];

export default function Profile() {
    const { user, loading, logout, updateProfile, isWishlisted } = useAuth();
    const { addToast } = useContext(ToastContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState(location.state?.tab || 'overview');
    const [orders, setOrders] = useState([]);
    const [wishlistProducts, setWishlistProducts] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    // Settings form state
    const [editForm, setEditForm] = useState({ name: user?.name || '', favoriteAnime: user?.favoriteAnime || '' });
    const [saving, setSaving] = useState(false);

    // Password change state
    const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
    const [pwSaving, setPwSaving] = useState(false);
    const [pwError, setPwError] = useState('');

    useEffect(() => {
        if (!loading && !user) { navigate('/login', { state: { from: '/profile' } }); return; }
        if (user) setEditForm({ name: user.name, favoriteAnime: user.favoriteAnime || '' });
    }, [user, loading, navigate]);

    useEffect(() => {
        if (activeTab === 'orders' && user) {
            setLoadingData(true);
            // ✅ Correct endpoint — returns full order objects with items, total, status
            axios.get('/api/auth/orders')
                .then(r => setOrders(r.data.orders || []))
                .catch(() => addToast('Could not load orders. Check connection.', 'error'))
                .finally(() => setLoadingData(false));
        }
        if (activeTab === 'wishlist' && user) {
            setLoadingData(true);
            axios.get('/api/auth/wishlist')
                .then(r => setWishlistProducts(r.data.products || []))
                .catch(() => addToast('Could not load wishlist. Check connection.', 'error'))
                .finally(() => setLoadingData(false));
        }
    }, [activeTab, user, addToast]);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateProfile(editForm);
            addToast('Profile updated! ✅', 'success');
        } catch {
            addToast('Update failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        addToast('Logged out. See you soon! 👋', 'info');
        navigate('/');
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPwError('');
        if (pwForm.newPw.length < 6) { setPwError('New password must be at least 6 characters'); return; }
        if (pwForm.newPw !== pwForm.confirm) { setPwError('Passwords do not match!'); return; }
        setPwSaving(true);
        try {
            await axios.put('/api/auth/change-password', {
                currentPassword: pwForm.current,
                newPassword: pwForm.newPw
            });
            addToast('Password changed successfully! 🔒', 'success');
            setPwForm({ current: '', newPw: '', confirm: '' });
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to change password';
            setPwError(msg);
            addToast(msg, 'error');
        } finally {
            setPwSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="spinner" />
            </div>
        );
    }
    
    if (!user) return null;

    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=b6e3f4`;

    return (
        <div className="profile-page">
            {/* Profile Hero */}
            <div className="profile-hero">
                <div className="profile-hero__bg" />
                <div className="container profile-hero__inner">
                    <div className="profile-avatar">
                        <img src={avatarUrl} alt={user.name} />
                    </div>
                    <div className="profile-info">
                        <h1 className="profile-name">{user.name}</h1>
                        <p className="profile-email">📧 {user.email}</p>
                        {user.favoriteAnime && (
                            <p className="profile-fave">🎌 Favorite: <strong>{user.favoriteAnime}</strong></p>
                        )}
                        <p className="profile-joined">Member since {formatDate(user.createdAt || user.created_at)}</p>
                    </div>
                    <button className="btn btn-secondary btn-sm profile-logout-btn" onClick={handleLogout} id="logout-btn">
                        🚪 Logout
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="profile-tabs-bar">
                <div className="container profile-tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            id={`profile-tab-${tab.id}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="container profile-content">

                {/* ── Overview ── */}
                {activeTab === 'overview' && (
                    <div className="profile-overview">
                        <div className="overview-stats">
                            {[
                                { label: 'Orders Placed', value: user.orders?.length || 0, icon: '📦' },
                                { label: 'Wishlist Items', value: user.wishlist?.length || 0, icon: '❤️' },
                                { label: 'Member Level', value: 'Anime Fan', icon: '⭐' },
                            ].map(s => (
                                <div key={s.label} className="overview-stat">
                                    <span className="overview-stat__icon">{s.icon}</span>
                                    <span className="overview-stat__value">{s.value}</span>
                                    <span className="overview-stat__label">{s.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="overview-cta">
                            <Link to="/shop" className="btn btn-primary">🛒 Continue Shopping</Link>
                            <button className="btn btn-secondary" onClick={() => setActiveTab('wishlist')}>❤️ View Wishlist</button>
                            <button className="btn btn-secondary" onClick={() => setActiveTab('orders')}>📦 View Orders</button>
                        </div>
                    </div>
                )}

                {/* ── Orders ── */}
                {activeTab === 'orders' && (
                    <div className="profile-orders">
                        <h2 className="profile-section-title">Your Orders</h2>
                        {loadingData ? (
                            <div className="spinner-wrapper"><div className="spinner" /></div>
                        ) : orders.length === 0 ? (
                            <div className="profile-empty">
                                <div style={{ fontSize: '4rem' }}>📦</div>
                                <h3>No orders yet!</h3>
                                <p>Start shopping to see your orders here.</p>
                                <Link to="/shop" className="btn btn-primary">Shop Now</Link>
                            </div>
                        ) : (
                            <div className="orders-list">
                                {orders.map(order => {
                                    // ✅ DB returns snake_case — support both
                                    const createdAt = order.created_at || order.createdAt;
                                    const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
                                    const statusColors = {
                                        confirmed: '#3b82f6',
                                        shipped:   '#f59e0b',
                                        delivered: '#10b981',
                                        cancelled: '#ef4444',
                                    };
                                    const dotColor = statusColors[order.status] || '#6b7280';
                                    return (
                                    <div key={order.id} className="order-card">
                                        <div className="order-card__header">
                                            <div>
                                                <span className="order-id">{order.id}</span>
                                                <span className="order-date">{createdAt ? formatDate(createdAt) : '—'}</span>
                                            </div>
                                            <div className="order-status">
                                                <span className="status-dot" style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />
                                                <span style={{ color: dotColor, fontWeight: 600, textTransform: 'capitalize' }}>{order.status}</span>
                                            </div>
                                        </div>
                                        <div className="order-items-list">
                                            {items.map((item, i) => (
                                                <div key={i} className="order-item-row">
                                                    <span className="order-item-name">{item.name}</span>
                                                    <span className="order-item-qty">×{item.quantity}</span>
                                                    <span className="order-item-price">{formatPrice(item.price * item.quantity)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="order-card__footer">
                                            <span>Total: <strong style={{ color: 'var(--accent-gold)' }}>{formatPrice(order.total)}</strong></span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Wishlist ── */}
                {activeTab === 'wishlist' && (
                    <div className="profile-wishlist">
                        <h2 className="profile-section-title">Your Wishlist ❤️</h2>
                        {loadingData ? (
                            <div className="spinner-wrapper"><div className="spinner" /></div>
                        ) : wishlistProducts.length === 0 ? (
                            <div className="profile-empty">
                                <div style={{ fontSize: '4rem' }}>❤️</div>
                                <h3>Your wishlist is empty!</h3>
                                <p>Click the ❤️ on any product to save it here.</p>
                                <Link to="/shop" className="btn btn-primary">Browse Products</Link>
                            </div>
                        ) : (
                            <div className="products-grid">
                                {wishlistProducts.map(p => <ProductCard key={p.id} product={p} />)}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Settings ── */}
                {activeTab === 'settings' && (
                    <div className="profile-settings">
                        <h2 className="profile-section-title">Account Settings</h2>
                        <div className="settings-card">
                            <form onSubmit={handleSaveProfile} className="settings-form">
                                <div className="form-group">
                                    <label htmlFor="settings-name">Display Name</label>
                                    <input
                                        id="settings-name"
                                        type="text"
                                        value={editForm.name}
                                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="settings-email">Email (cannot change)</label>
                                    <input id="settings-email" type="email" value={user.email} disabled style={{ opacity: 0.5 }} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="settings-anime">Favorite Anime</label>
                                    <input
                                        id="settings-anime"
                                        type="text"
                                        placeholder="e.g. Naruto, One Piece..."
                                        value={editForm.favoriteAnime}
                                        onChange={e => setEditForm(f => ({ ...f, favoriteAnime: e.target.value }))}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={saving} id="save-profile-btn">
                                    {saving ? 'Saving...' : '💾 Save Changes'}
                                </button>
                            </form>
                        </div>

                        {/* Danger zone */}
                        <div className="settings-danger">
                            <h3>Change Password 🔒</h3>
                            <form onSubmit={handlePasswordChange} className="settings-form" style={{ marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label htmlFor="pw-current">Current Password</label>
                                    <input
                                        id="pw-current"
                                        type="password"
                                        placeholder="Enter current password"
                                        value={pwForm.current}
                                        onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="pw-new">New Password</label>
                                    <input
                                        id="pw-new"
                                        type="password"
                                        placeholder="Min. 6 characters"
                                        value={pwForm.newPw}
                                        onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="pw-confirm">Confirm New Password</label>
                                    <input
                                        id="pw-confirm"
                                        type="password"
                                        placeholder="Repeat new password"
                                        value={pwForm.confirm}
                                        onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                                        required
                                    />
                                </div>
                                {pwError && (
                                    <div style={{ color: 'var(--accent-red)', fontSize: '0.85rem', padding: '0.5rem 0.75rem', background: 'rgba(230,57,70,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(230,57,70,0.2)' }}>
                                        ⚠️ {pwError}
                                    </div>
                                )}
                                <button type="submit" className="btn btn-secondary" disabled={pwSaving} id="change-pw-btn">
                                    {pwSaving ? 'Changing...' : '🔒 Change Password'}
                                </button>
                            </form>

                            <h3>Account Actions</h3>
                            <button className="btn btn-secondary" onClick={handleLogout} id="settings-logout-btn">
                                🚪 Logout of Account
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
