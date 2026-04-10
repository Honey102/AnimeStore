import React, { useEffect, useState, useContext } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { ToastContext } from '../../App';

const EMOJI_OPTIONS = ['🗡️','🔑','🖼️','👕','✨','🎌','🏆','🎭','⚔️','🛡️','👒','🎒','💎','🔥','❄️','⚡'];

export default function AdminCategories() {
    const { adminAPI } = useAdmin();
    const { addToast } = useContext(ToastContext);
    const [settings, setSettings] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editModal, setEditModal] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Promise.all([
            adminAPI.get('/api/admin/settings'),
            adminAPI.get('/api/admin/products'),
        ]).then(([s, p]) => {
            setSettings(s.data.settings);
            setProducts(p.data.products || []);
        }).catch(() => addToast('Could not load categories', 'error'))
          .finally(() => setLoading(false));
    }, []);

    const getCount = (catId) => products.filter(p => p.category === catId).length;

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            const updatedCats = (settings.categories || []).map(c => c.id === editModal.id ? editModal : c);
            const updatedSettings = { ...settings, categories: updatedCats };
            await adminAPI.put('/api/admin/settings', updatedSettings);
            setSettings(updatedSettings);
            addToast('Category updated! ✅', 'success');
            setEditModal(null);
        } catch { addToast('Save failed', 'error'); }
        finally { setSaving(false); }
    };

    if (loading || !settings) return <div className="admin-page"><div className="admin-loading">⏳ Loading...</div></div>;

    const categories = settings.categories || [];

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Categories</h1>
                    <p className="admin-page-subtitle">Edit category labels and icons</p>
                </div>
            </div>

            <div className="admin-table-wrap">
                <div className="admin-table-scroll">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Icon</th>
                                <th>ID</th>
                                <th>Label</th>
                                <th>Products</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map(cat => (
                                <tr key={cat.id}>
                                    <td style={{ fontSize: '1.5rem' }}>{cat.icon}</td>
                                    <td><span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{cat.id}</span></td>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat.label}</td>
                                    <td>
                                        <span style={{ background: 'rgba(244,162,23,0.12)', color: 'var(--accent-gold)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 700 }}>
                                            {getCount(cat.id)} products
                                        </span>
                                    </td>
                                    <td>
                                        <button className="admin-btn admin-btn--secondary" style={{ fontSize: '0.78rem' }} onClick={() => setEditModal({ ...cat })}>
                                            ✏️ Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                💡 Only label and icon can be edited. Category IDs are kept stable to avoid breaking existing product links.
            </div>

            {/* Edit Modal */}
            {editModal && (
                <div className="admin-modal-backdrop" onClick={e => e.target === e.currentTarget && setEditModal(null)}>
                    <div className="admin-modal admin-modal--sm">
                        <div className="admin-modal__header">
                            <span className="admin-modal__title">✏️ Edit Category</span>
                            <button className="admin-modal__close" onClick={() => setEditModal(null)}>✕</button>
                        </div>
                        <div className="admin-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="admin-field">
                                <label>Label</label>
                                <input value={editModal.label} onChange={e => setEditModal(m => ({ ...m, label: e.target.value }))} />
                            </div>
                            <div className="admin-field">
                                <label>Icon (pick or type emoji)</label>
                                <input value={editModal.icon} onChange={e => setEditModal(m => ({ ...m, icon: e.target.value }))} maxLength={4} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quick Pick</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {EMOJI_OPTIONS.map(e => (
                                        <button key={e} type="button"
                                            style={{ padding: '0.35rem 0.55rem', borderRadius: 'var(--radius-sm)', background: editModal.icon === e ? 'rgba(230,57,70,0.15)' : 'var(--bg-glass-light)', border: editModal.icon === e ? '1px solid var(--accent-red)' : '1px solid var(--border-subtle)', fontSize: '1.1rem', cursor: 'pointer' }}
                                            onClick={() => setEditModal(m => ({ ...m, icon: e }))}>
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-glass-light)', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem' }}>
                                Preview: {editModal.icon} <strong>{editModal.label}</strong>
                            </div>
                        </div>
                        <div className="admin-modal__footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setEditModal(null)}>Cancel</button>
                            <button className="admin-btn admin-btn--primary" onClick={handleSaveEdit} disabled={saving}>
                                {saving ? '⏳ Saving...' : '✅ Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
