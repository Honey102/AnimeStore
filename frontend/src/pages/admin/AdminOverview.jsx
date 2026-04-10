import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

function formatPrice(p) { return `₹${Number(p).toLocaleString('en-IN')}`; }
function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

const statusColors = {
    confirmed: 'status-badge--confirmed',
    shipped:   'status-badge--shipped',
    delivered: 'status-badge--delivered',
    cancelled: 'status-badge--cancelled',
};

export default function AdminOverview() {
    const { adminAPI } = useAdmin();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminAPI.get('/api/admin/overview')
            .then(r => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="admin-page">
            <div className="admin-loading">⏳ Loading dashboard...</div>
        </div>
    );

    const { stats, recentOrders, lowStock, topProducts } = data || {};

    const CARDS = [
        { icon: '📦', label: 'Total Products', value: stats?.totalProducts ?? 0, color: 'stat-icon--red', link: '/admin/products' },
        { icon: '🧾', label: 'Total Orders',   value: stats?.totalOrders ?? 0,   sub: `${stats?.todayOrders ?? 0} today`, color: 'stat-icon--gold', link: '/admin/orders' },
        { icon: '👥', label: 'Registered Users', value: stats?.totalUsers ?? 0,  color: 'stat-icon--purple', link: '/admin/users' },
        { icon: '💰', label: 'Revenue (Month)', value: formatPrice(stats?.monthRevenue ?? 0), sub: `${stats?.monthOrders ?? 0} orders`, color: 'stat-icon--teal' },
    ];

    return (
        <div className="admin-page">
            {/* Header */}
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Dashboard Overview</h1>
                    <p className="admin-page-subtitle">Welcome back, Admin! 🎌 Here's what's happening.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="admin-stats-grid">
                {CARDS.map(c => (
                    <div className="admin-stat-card" key={c.label} style={{ cursor: c.link ? 'pointer' : 'default' }}
                        onClick={() => c.link && (window.location.href = c.link)}>
                        <div className={`admin-stat-icon ${c.color}`}>{c.icon}</div>
                        <div className="admin-stat-info">
                            <div className="admin-stat-value">{c.value}</div>
                            <div className="admin-stat-label">{c.label}</div>
                            {c.sub && <div className="admin-stat-sub">{c.sub}</div>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Dashboard Grid */}
            <div className="admin-dashboard-grid">
                {/* Recent Orders */}
                <div className="admin-card">
                    <div className="admin-card__header">
                        <span className="admin-card__title">🧾 Recent Orders</span>
                        <Link to="/admin/orders" className="admin-btn admin-btn--secondary" style={{ fontSize: '0.78rem' }}>View All →</Link>
                    </div>
                    <div className="admin-card__body" style={{ padding: '0.75rem 1.25rem' }}>
                        {(recentOrders || []).length === 0 && (
                            <div className="admin-empty"><div className="admin-empty-icon">📭</div>No orders yet.</div>
                        )}
                        {(recentOrders || []).map(o => (
                            <div key={o.id} className="admin-recent-order">
                                <span className="order-id">{o.id}</span>
                                <span className="order-name">{o.customer?.name || 'Guest'}</span>
                                <span className="order-amt">{formatPrice(o.total || 0)}</span>
                                <span className={`status-badge ${statusColors[o.status] || ''}`}>{o.status}</span>
                                <span className="order-time">{timeAgo(o.createdAt)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Low Stock */}
                    <div className="admin-card">
                        <div className="admin-card__header">
                            <span className="admin-card__title">⚠️ Low Stock Alert</span>
                            <Link to="/admin/products" className="admin-btn admin-btn--secondary" style={{ fontSize: '0.78rem' }}>Manage →</Link>
                        </div>
                        <div className="admin-card__body" style={{ padding: '0.75rem 1.25rem' }}>
                            {(lowStock || []).length === 0 && (
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.83rem', padding: '0.5rem 0' }}>✅ All products have good stock!</div>
                            )}
                            {(lowStock || []).map(p => (
                                <div key={p.id} className="admin-low-stock-item">
                                    <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{p.name}</span>
                                    <span className={`stock-count ${p.stock > 5 ? 'stock-count--warn' : ''}`}>{p.stock} left</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="admin-card">
                        <div className="admin-card__header">
                            <span className="admin-card__title">🏆 Top Products</span>
                        </div>
                        <div className="admin-card__body" style={{ padding: '0.75rem 1.25rem' }}>
                            {(topProducts || []).map((p, i) => (
                                <div key={p.id} className="admin-top-product">
                                    <span className={`top-product-rank top-product-rank--${i + 1}`}>{i + 1}</span>
                                    <span className="top-product-name">{p.name}</span>
                                    <span className="top-product-reviews">⭐ {p.reviews}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
