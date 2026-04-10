import React, { useEffect, useState, useContext } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { ToastContext } from '../../App';

export default function AdminOffers() {
    const { adminAPI } = useAdmin();
    const { addToast } = useContext(ToastContext);
    const [settings, setSettings] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [productSearch, setProductSearch] = useState('');

    useEffect(() => {
        Promise.all([
            adminAPI.get('/api/admin/settings'),
            adminAPI.get('/api/admin/products'),
        ]).then(([s, p]) => {
            setSettings(s.data.settings);
            setProducts(p.data.products || []);
        }).catch(() => addToast('Could not load settings', 'error'))
          .finally(() => setLoading(false));
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            await adminAPI.put('/api/admin/settings', settings);
            addToast('Settings saved! ✅', 'success');
        } catch { addToast('Save failed', 'error'); }
        finally { setSaving(false); }
    };

    const update = (section, key, value) => {
        setSettings(s => ({ ...s, [section]: { ...s[section], [key]: value } }));
    };

    const toggleFlashProduct = (id) => {
        const ids = settings.flashSale?.productIds || [];
        const updated = ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id];
        update('flashSale', 'productIds', updated);
    };

    if (loading || !settings) return <div className="admin-page"><div className="admin-loading">⏳ Loading...</div></div>;

    const { flashSale, siteSettings, announcements } = settings;
    const filteredProducts = products.filter(p =>
        !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.anime.toLowerCase().includes(productSearch.toLowerCase())
    );

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Offers & Promotions</h1>
                    <p className="admin-page-subtitle">Flash sale, announcements, shipping settings</p>
                </div>
                <button className="admin-btn admin-btn--primary" onClick={save} disabled={saving}>
                    {saving ? '⏳ Saving...' : '💾 Save All Settings'}
                </button>
            </div>

            <div className="admin-offers-grid">
                {/* ── Flash Sale ── */}
                <div className="admin-card">
                    <div className="admin-card__header">
                        <span className="admin-card__title">⚡ Flash Sale</span>
                        <label className="admin-toggle">
                            <input type="checkbox" checked={flashSale?.active || false} onChange={e => update('flashSale', 'active', e.target.checked)} />
                            <span className="admin-toggle-slider" />
                        </label>
                    </div>
                    <div className="admin-card__body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="admin-field">
                            <label>Sale Title</label>
                            <input value={flashSale?.title || ''} onChange={e => update('flashSale', 'title', e.target.value)} placeholder="Today's Hot Deals" />
                        </div>
                        <div className="admin-field">
                            <label>Sale End Time</label>
                            <input type="datetime-local" value={flashSale?.endTime ? new Date(flashSale.endTime).toISOString().slice(0, 16) : ''}
                                onChange={e => update('flashSale', 'endTime', e.target.value ? new Date(e.target.value).toISOString() : null)} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                Flash Sale Products ({(flashSale?.productIds || []).length} selected)
                            </label>
                            <div className="admin-search-input" style={{ marginBottom: '0.5rem' }}>
                                <span>🔍</span>
                                <input placeholder="Search products..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                            </div>
                            <div className="admin-product-pick-grid">
                                {filteredProducts.map(p => (
                                    <div
                                        key={p.id}
                                        className={`admin-product-pick-item ${(flashSale?.productIds || []).includes(p.id) ? 'selected' : ''}`}
                                        onClick={() => toggleFlashProduct(p.id)}
                                    >
                                        <span>{(flashSale?.productIds || []).includes(p.id) ? '✅' : '⬜'}</span>
                                        <span style={{ fontSize: '0.75rem' }}>{p.name.slice(0, 22)}{p.name.length > 22 ? '…' : ''}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right: Announcement + Shipping ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Announcement Banner */}
                    <div className="admin-card">
                        <div className="admin-card__header">
                            <span className="admin-card__title">📢 Announcement Banner</span>
                            <label className="admin-toggle">
                                <input type="checkbox" checked={announcements?.active || false} onChange={e => update('announcements', 'active', e.target.checked)} />
                                <span className="admin-toggle-slider" />
                            </label>
                        </div>
                        <div className="admin-card__body">
                            <div className="admin-field">
                                <label>Banner Text</label>
                                <textarea
                                    value={announcements?.text || ''}
                                    onChange={e => update('announcements', 'text', e.target.value)}
                                    placeholder="Free shipping on orders above ₹999!"
                                    rows={2}
                                />
                            </div>
                            {announcements?.active && (
                                <div style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', background: 'rgba(244,162,23,0.12)', border: '1px solid rgba(244,162,23,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--accent-gold)' }}>
                                    🔔 Preview: {announcements.text}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Shipping Settings */}
                    <div className="admin-card">
                        <div className="admin-card__header">
                            <span className="admin-card__title">🚚 Shipping Settings</span>
                        </div>
                        <div className="admin-card__body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div className="admin-field">
                                <label>Free Shipping Above (₹)</label>
                                <input type="number" min="0" value={siteSettings?.freeShippingThreshold ?? 999}
                                    onChange={e => update('siteSettings', 'freeShippingThreshold', Number(e.target.value))} />
                            </div>
                            <div className="admin-field">
                                <label>Flat Shipping Cost (₹)</label>
                                <input type="number" min="0" value={siteSettings?.shippingCost ?? 99}
                                    onChange={e => update('siteSettings', 'shippingCost', Number(e.target.value))} />
                            </div>
                            <div className="admin-toggle-wrap">
                                <div>
                                    <div className="admin-toggle-label">Cash on Delivery</div>
                                    <div className="admin-toggle-sub">Allow COD payment option at checkout</div>
                                </div>
                                <label className="admin-toggle">
                                    <input type="checkbox" checked={siteSettings?.codAvailable ?? true}
                                        onChange={e => update('siteSettings', 'codAvailable', e.target.checked)} />
                                    <span className="admin-toggle-slider" />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
