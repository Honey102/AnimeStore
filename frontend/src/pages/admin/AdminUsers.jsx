import React, { useEffect, useState, useContext } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { ToastContext } from '../../App';

function formatPrice(p) { return `₹${Number(p).toLocaleString('en-IN')}`; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }

export default function AdminUsers() {
    const { adminAPI } = useAdmin();
    const { addToast } = useContext(ToastContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const load = () => {
        setLoading(true);
        adminAPI.get('/api/admin/users')
            .then(r => setUsers(r.data.users || []))
            .catch(() => addToast('Could not load users', 'error'))
            .finally(() => setLoading(false));
    };
    useEffect(load, []);

    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    });

    const handleDelete = async () => {
        try {
            await adminAPI.delete(`/api/admin/users/${deleteConfirm.id}`);
            addToast('User deleted! 🗑️', 'success');
            setDeleteConfirm(null);
            setSelected(null);
            load();
        } catch { addToast('Delete failed.', 'error'); }
    };

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Users</h1>
                    <p className="admin-page-subtitle">{users.length} registered users</p>
                </div>
            </div>

            <div className="admin-table-wrap">
                <div className="admin-table-toolbar">
                    <div className="admin-search-input">
                        <span>🔍</span>
                        <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>

                {loading ? <div className="admin-loading">⏳ Loading users...</div> : (
                    <div className="admin-table-scroll">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Orders</th>
                                    <th>Wishlist</th>
                                    <th>Total Spent</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No users found.</td></tr>
                                )}
                                {filtered.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: '50%',
                                                    background: 'var(--accent-red)', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.9rem', fontWeight: 700, color: '#fff', flexShrink: 0
                                                }}>
                                                    {(u.name || 'U')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{u.name || '—'}</div>
                                                    {u.favoriteAnime && <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>❤️ {u.favoriteAnime}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>{u.email}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{ fontWeight: 700, color: u.ordersCount > 0 ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                                                {u.ordersCount}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{u.wishlistCount}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>{formatPrice(u.totalSpent)}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{fmtDate(u.createdAt)}</td>
                                        <td>
                                            <div className="admin-actions">
                                                <button className="admin-btn admin-btn--secondary" style={{ fontSize: '0.78rem' }} onClick={() => setSelected(u)}>👁️ View</button>
                                                <button className="admin-btn admin-btn--icon" onClick={() => setDeleteConfirm(u)} title="Delete user">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.78rem', borderTop: '1px solid var(--border-subtle)' }}>
                    Showing {filtered.length} of {users.length} users
                </div>
            </div>

            {/* User Detail Modal */}
            {selected && (
                <div className="admin-modal-backdrop" onClick={e => e.target === e.currentTarget && setSelected(null)}>
                    <div className="admin-modal admin-modal--lg">
                        <div className="admin-modal__header">
                            <span className="admin-modal__title">👤 User Profile — {selected.name}</span>
                            <button className="admin-modal__close" onClick={() => setSelected(null)}>✕</button>
                        </div>
                        <div className="admin-modal__body">
                            <div className="order-detail-grid">
                                <div><div className="order-detail-label">Name</div><div className="order-detail-value">{selected.name || '—'}</div></div>
                                <div><div className="order-detail-label">Email</div><div className="order-detail-value">{selected.email}</div></div>
                                <div><div className="order-detail-label">Favorite Anime</div><div className="order-detail-value">{selected.favoriteAnime || '—'}</div></div>
                                <div><div className="order-detail-label">Joined</div><div className="order-detail-value">{fmtDate(selected.createdAt)}</div></div>
                                <div><div className="order-detail-label">Total Orders</div><div className="order-detail-value" style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{selected.ordersCount}</div></div>
                                <div><div className="order-detail-label">Total Spent</div><div className="order-detail-value" style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{formatPrice(selected.totalSpent)}</div></div>
                                <div><div className="order-detail-label">Wishlist Items</div><div className="order-detail-value">{selected.wishlistCount}</div></div>
                            </div>
                        </div>
                        <div className="admin-modal__footer">
                            <button className="admin-btn admin-btn--danger" onClick={() => { setSelected(null); setDeleteConfirm(selected); }}>🗑️ Delete Account</button>
                            <button className="admin-btn admin-btn--secondary" onClick={() => setSelected(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div className="admin-modal-backdrop" onClick={e => e.target === e.currentTarget && setDeleteConfirm(null)}>
                    <div className="admin-modal admin-modal--sm">
                        <div className="admin-modal__header">
                            <span className="admin-modal__title">🗑️ Delete User</span>
                            <button className="admin-modal__close" onClick={() => setDeleteConfirm(null)}>✕</button>
                        </div>
                        <div className="admin-modal__body">
                            <p className="admin-confirm-text">
                                Are you sure you want to permanently delete <span className="admin-confirm-highlight">"{deleteConfirm.name}" ({deleteConfirm.email})</span>? All their data will be lost.
                            </p>
                        </div>
                        <div className="admin-modal__footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="admin-btn admin-btn--danger" onClick={handleDelete}>🗑️ Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
