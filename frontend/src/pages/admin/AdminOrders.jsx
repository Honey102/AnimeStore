import React, { useEffect, useState, useContext } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { ToastContext } from '../../App';

const STATUSES = ['confirmed', 'shipped', 'delivered', 'cancelled'];
const STATUS_ICONS = { confirmed: '🟢', shipped: '🚀', delivered: '✅', cancelled: '❌' };
const STATUS_CLASS = {
    confirmed: 'status-badge--confirmed',
    shipped:   'status-badge--shipped',
    delivered: 'status-badge--delivered',
    cancelled: 'status-badge--cancelled',
};

function formatPrice(p) { return `₹${Number(p).toLocaleString('en-IN')}`; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '-'; }

export default function AdminOrders() {
    const { adminAPI } = useAdmin();
    const { addToast } = useContext(ToastContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selected, setSelected] = useState(null);
    const [updating, setUpdating] = useState(null);
    const [page, setPage] = useState(1);
    const PER_PAGE = 12;

    useEffect(() => {
        adminAPI.get('/api/admin/orders')
            .then(r => setOrders(r.data.orders || []))
            .catch(() => addToast('Could not load orders', 'error'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = orders.filter(o => {
        const q = search.toLowerCase();
        const matchS = !q || o.id.toLowerCase().includes(q) || (o.customer?.name || '').toLowerCase().includes(q);
        const matchStatus = filterStatus === 'all' || o.status === filterStatus;
        return matchS && matchStatus;
    });
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const updateStatus = async (orderId, status) => {
        setUpdating(orderId);
        try {
            await adminAPI.put(`/api/admin/orders/${orderId}/status`, { status });
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
            if (selected?.id === orderId) setSelected(s => ({ ...s, status }));
            addToast(`Status → ${status} ✅`, 'success');
        } catch { addToast('Update failed', 'error'); }
        finally { setUpdating(null); }
    };

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Orders</h1>
                    <p className="admin-page-subtitle">{orders.length} total orders (guest + user)</p>
                </div>
            </div>

            <div className="admin-table-wrap">
                <div className="admin-table-toolbar">
                    <div className="admin-search-input">
                        <span>🔍</span>
                        <input placeholder="Search by order ID or customer name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <select className="admin-filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
                        <option value="all">All Statuses</option>
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_ICONS[s]} {s}</option>)}
                    </select>
                </div>

                {loading ? <div className="admin-loading">⏳ Loading orders...</div> : (
                    <div className="admin-table-scroll">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.length === 0 && (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No orders found.</td></tr>
                                )}
                                {paginated.map(o => (
                                    <tr key={o.id}>
                                        <td><span style={{ fontFamily: 'monospace', color: 'var(--accent-gold)', fontWeight: 600, fontSize: '0.8rem' }}>{o.id}</span></td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{o.customer?.name || 'Guest'}</div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{o.customer?.email || o.customerEmail || ''}</div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{(o.items || []).length} item(s)</td>
                                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatPrice(o.total || 0)}</td>
                                        <td>
                                            <span className={`status-badge ${STATUS_CLASS[o.status] || ''}`}>
                                                {STATUS_ICONS[o.status]} {o.status}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{fmtDate(o.created_at || o.createdAt)}</td>
                                        <td>
                                            <div className="admin-actions">
                                                <button className="admin-btn admin-btn--secondary" style={{ fontSize: '0.78rem' }} onClick={() => setSelected(o)}>
                                                    👁️ View
                                                </button>
                                                <select
                                                    className="admin-status-select"
                                                    value={o.status}
                                                    disabled={updating === o.id}
                                                    onChange={e => updateStatus(o.id, e.target.value)}
                                                >
                                                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="admin-pagination">
                        <span>Showing {Math.min((page-1)*PER_PAGE+1, filtered.length)}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}</span>
                        <div className="admin-pagination-btns">
                            <button className="admin-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button key={i+1} className={`admin-page-btn ${page === i+1 ? 'active' : ''}`} onClick={() => setPage(i+1)}>{i+1}</button>
                            ))}
                            <button className="admin-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Order Detail Modal ── */}
            {selected && (
                <div className="admin-modal-backdrop" onClick={e => e.target === e.currentTarget && setSelected(null)}>
                    <div className="admin-modal admin-modal--lg">
                        <div className="admin-modal__header">
                            <span className="admin-modal__title">🧾 Order Details — {selected.id}</span>
                            <button className="admin-modal__close" onClick={() => setSelected(null)}>✕</button>
                        </div>
                        <div className="admin-modal__body">
                            {/* Customer info */}
                            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Customer Info</h4>
                            <div className="order-detail-grid">
                                <div><div className="order-detail-label">Name</div><div className="order-detail-value">{selected.customer?.name || 'Guest'}</div></div>
                                <div><div className="order-detail-label">Email</div><div className="order-detail-value">{selected.customer?.email || selected.customerEmail || '—'}</div></div>
                                <div><div className="order-detail-label">Phone</div><div className="order-detail-value">{selected.customer?.phone || '—'}</div></div>
                                <div><div className="order-detail-label">Payment</div><div className="order-detail-value">{selected.customer?.payment || '—'}</div></div>
                                <div className="order-detail-grid" style={{ gridColumn: '1/-1', gridTemplateColumns: '1fr' }}>
                                    <div><div className="order-detail-label">Address</div>
                                    <div className="order-detail-value">{selected.customer?.address ? `${selected.customer.address}, ${selected.customer.city} ${selected.customer.pincode}` : '—'}</div></div>
                                </div>
                            </div>

                            {/* Items */}
                            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '1rem 0 0.75rem' }}>Items Ordered</h4>
                            <div className="order-items-list">
                                {(selected.items || []).map((item, i) => (
                                    <div key={i} className="order-item-row">
                                        <span style={{ flex: 1, color: 'var(--text-primary)' }}>{item.name}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>x{item.quantity}</span>
                                        <span style={{ color: 'var(--accent-gold)', fontWeight: 700, minWidth: '80px', textAlign: 'right' }}>{formatPrice(item.price * item.quantity)}</span>
                                    </div>
                                ))}
                                <div className="order-item-row" style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '0.25rem' }}>
                                    <span style={{ flex: 1, fontWeight: 700, color: 'var(--text-primary)' }}>Total</span>
                                    <span style={{ color: 'var(--accent-gold)', fontWeight: 800, fontSize: '1rem' }}>{formatPrice(selected.total || 0)}</span>
                                </div>
                            </div>

                            {/* Status update */}
                            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Update Status:</span>
                                <select
                                    className="admin-status-select"
                                    style={{ fontSize: '0.88rem', padding: '0.45rem 0.75rem' }}
                                    value={selected.status}
                                    onChange={e => updateStatus(selected.id, e.target.value)}
                                >
                                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_ICONS[s]} {s}</option>)}
                                </select>
                                <span className={`status-badge ${STATUS_CLASS[selected.status]}`}>{STATUS_ICONS[selected.status]} {selected.status}</span>
                            </div>
                        </div>
                        <div className="admin-modal__footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setSelected(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
