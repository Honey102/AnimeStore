import React, { useState, useContext } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { ToastContext } from '../../App';

export default function AdminSettings() {
    const { adminAPI, adminLogout } = useAdmin();
    const { addToast } = useContext(ToastContext);
    const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
    const [pwSaving, setPwSaving] = useState(false);
    const [maintenance, setMaintenance] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (pwForm.next !== pwForm.confirm) {
            addToast('New passwords do not match!', 'error');
            return;
        }
        if (pwForm.next.length < 6) {
            addToast('Password must be at least 6 characters', 'error');
            return;
        }
        setPwSaving(true);
        try {
            const res = await adminAPI.post('/api/admin/change-password', {
                currentPassword: pwForm.current,
                newPassword: pwForm.next,
            });
            addToast(res.data.message, 'warning');
            setPwForm({ current: '', next: '', confirm: '' });
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to change password', 'error');
        } finally { setPwSaving(false); }
    };

    const downloadExport = async (type) => {
        try {
            const token = sessionStorage.getItem('animestore_admin_token');
            const url = `/api/admin/export/${type}`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            const blob = await res.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = type === 'products' ? 'products.json' : `${type}.csv`;
            a.click();
            addToast(`${type} exported! 📥`, 'success');
        } catch { addToast('Export failed', 'error'); }
    };

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Settings</h1>
                    <p className="admin-page-subtitle">Admin password, data export, site controls</p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 680 }}>

                {/* ── Change Password ── */}
                <div className="admin-card">
                    <div className="admin-card__header">
                        <span className="admin-card__title">🔑 Change Admin Password</span>
                    </div>
                    <div className="admin-card__body">
                        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="admin-field">
                                <label>Current Password</label>
                                <input type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} required />
                            </div>
                            <div className="admin-field">
                                <label>New Password</label>
                                <input type="password" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} required minLength={6} />
                            </div>
                            <div className="admin-field">
                                <label>Confirm New Password</label>
                                <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
                            </div>
                            <div style={{ padding: '0.75rem 1rem', background: 'rgba(244,162,23,0.08)', border: '1px solid rgba(244,162,23,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--accent-gold)' }}>
                                ⚠️ After changing, you must also update <code>ADMIN_PASSWORD</code> in your backend <code>.env</code> file to keep in sync.
                            </div>
                            <button type="submit" className="admin-btn admin-btn--primary" style={{ alignSelf: 'flex-start' }} disabled={pwSaving}>
                                {pwSaving ? '⏳ Saving...' : '🔑 Change Password'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── Export Data ── */}
                <div className="admin-card">
                    <div className="admin-card__header">
                        <span className="admin-card__title">📥 Export Data</span>
                    </div>
                    <div className="admin-card__body">
                        <div className="admin-export-grid">
                            <div className="admin-export-card">
                                <div className="admin-export-icon">🧾</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Orders</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CSV format</div>
                                <button className="admin-btn admin-btn--secondary" style={{ fontSize: '0.78rem' }} onClick={() => downloadExport('orders')}>
                                    📥 Download
                                </button>
                            </div>
                            <div className="admin-export-card">
                                <div className="admin-export-icon">👥</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Users</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CSV format</div>
                                <button className="admin-btn admin-btn--secondary" style={{ fontSize: '0.78rem' }} onClick={() => downloadExport('users')}>
                                    📥 Download
                                </button>
                            </div>
                            <div className="admin-export-card">
                                <div className="admin-export-icon">📦</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Products</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>JSON format</div>
                                <button className="admin-btn admin-btn--secondary" style={{ fontSize: '0.78rem' }} onClick={() => downloadExport('products')}>
                                    📥 Download
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Danger Zone ── */}
                <div className="admin-card" style={{ borderColor: 'rgba(230,57,70,0.25)' }}>
                    <div className="admin-card__header" style={{ borderColor: 'rgba(230,57,70,0.15)' }}>
                        <span className="admin-card__title" style={{ color: 'var(--accent-red)' }}>⚠️ Admin Actions</span>
                    </div>
                    <div className="admin-card__body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div className="admin-toggle-wrap">
                            <div>
                                <div className="admin-toggle-label">Clear Offline Orders Cache</div>
                                <div className="admin-toggle-sub">Remove localStorage-saved offline orders from browser</div>
                            </div>
                            <button className="admin-btn admin-btn--danger" style={{ fontSize: '0.78rem' }}
                                onClick={() => {
                                    localStorage.removeItem('animestore_offline_orders');
                                    addToast('Offline orders cache cleared!', 'info');
                                }}>
                                🗑️ Clear
                            </button>
                        </div>
                        <div className="admin-toggle-wrap">
                            <div>
                                <div className="admin-toggle-label">Logout from Admin Panel</div>
                                <div className="admin-toggle-sub">Clears your admin session token</div>
                            </div>
                            <button className="admin-btn admin-btn--danger" style={{ fontSize: '0.78rem' }}
                                onClick={() => { adminLogout(); window.location.href = '/admin/login'; }}>
                                🚪 Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>📋 System Info</strong><br />
                    Backend: Node.js + Express | Storage: JSON files | Auth: JWT (24h session)<br />
                    To change admin password permanently → update <code>ADMIN_PASSWORD</code> in <code>backend/.env</code>
                </div>
            </div>
        </div>
    );
}
