import React, { useEffect, useState, useContext } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { ToastContext } from '../../App';

const CATEGORIES = ['action-figures', 'keychains', 'posters', 'clothing', 'accessories'];
const BADGES = ['', 'Hot', 'New', 'Bestseller', 'Limited'];
const EMPTY_FORM = {
    name: '', category: 'action-figures', anime: '', price: '', originalPrice: '',
    stock: '', badge: '', description: '', tags: '', image: '', rating: '4.5', reviews: '0',
};

function formatPrice(p) { return `₹${Number(p).toLocaleString('en-IN')}`; }

export default function AdminProducts() {
    const { adminAPI } = useAdmin();
    const { addToast } = useContext(ToastContext);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('all');
    const [filterBadge, setFilterBadge] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null); // null = new product
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [stockModal, setStockModal] = useState(null); // { product, newStock }

    const load = () => {
        setLoading(true);
        adminAPI.get('/api/admin/products')
            .then(r => setProducts(r.data.products || []))
            .catch(() => addToast('Could not load products', 'error'))
            .finally(() => setLoading(false));
    };
    useEffect(load, []);

    // ── Filtering ──
    const filtered = products.filter(p => {
        const q = search.toLowerCase();
        const matchSearch = !q || p.name.toLowerCase().includes(q) || p.anime.toLowerCase().includes(q);
        const matchCat = filterCat === 'all' || p.category === filterCat;
        const matchBadge = filterBadge === 'all' || p.badge === filterBadge;
        return matchSearch && matchCat && matchBadge;
    });

    // ── Open add/edit modal ──
    const openAdd = () => { setEditingProduct(null); setForm(EMPTY_FORM); setModalOpen(true); };
    const openEdit = (p) => {
        setEditingProduct(p);
        setForm({
            name: p.name, category: p.category, anime: p.anime,
            price: p.price, originalPrice: p.originalPrice,
            stock: p.stock, badge: p.badge || '', description: p.description,
            tags: (p.tags || []).join(', '), image: p.image || '',
            rating: p.rating, reviews: p.reviews,
        });
        setModalOpen(true);
    };

    // ── Save product ──
    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        const payload = {
            ...form,
            price: Number(form.price),
            originalPrice: Number(form.originalPrice),
            stock: Number(form.stock),
            rating: Number(form.rating),
            reviews: Number(form.reviews),
            tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        };
        try {
            if (editingProduct) {
                await adminAPI.put(`/api/admin/products/${editingProduct.id}`, payload);
                addToast('Product updated! ✅', 'success');
            } else {
                await adminAPI.post('/api/admin/products', payload);
                addToast('Product added! ✅', 'success');
            }
            setModalOpen(false);
            load();
        } catch {
            addToast('Save failed. Try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ──
    const handleDelete = async () => {
        try {
            await adminAPI.delete(`/api/admin/products/${deleteConfirm.id}`);
            addToast('Product deleted! 🗑️', 'success');
            setDeleteConfirm(null);
            load();
        } catch { addToast('Delete failed.', 'error'); }
    };

    // ── Quick stock update ──
    const handleStockSave = async () => {
        try {
            const p = stockModal.product;
            await adminAPI.put(`/api/admin/products/${p.id}`, {
                ...p, stock: Number(stockModal.newStock),
                tags: (p.tags || []).join(', ')
            });
            addToast('Stock updated!', 'success');
            setStockModal(null);
            load();
        } catch { addToast('Stock update failed.', 'error'); }
    };

    const fc = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Products</h1>
                    <p className="admin-page-subtitle">{products.length} products total</p>
                </div>
                <button className="admin-btn admin-btn--primary" onClick={openAdd}>+ Add Product</button>
            </div>

            {/* Table */}
            <div className="admin-table-wrap">
                <div className="admin-table-toolbar">
                    <div className="admin-search-input">
                        <span>🔍</span>
                        <input placeholder="Search by name or anime..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <select className="admin-filter-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                            <option value="all">All Categories</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select className="admin-filter-select" value={filterBadge} onChange={e => setFilterBadge(e.target.value)}>
                            <option value="all">All Badges</option>
                            {BADGES.filter(Boolean).map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                </div>

                {loading ? <div className="admin-loading">⏳ Loading...</div> : (
                    <div className="admin-table-scroll">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Anime</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Badge</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No products match your filters.</td></tr>
                                )}
                                {filtered.map(p => (
                                    <tr key={p.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div className="admin-product-thumb">
                                                    {p.image && !p.image.includes('placeholder') ? (
                                                        <img src={p.image} alt={p.name} onError={e => e.target.style.display = 'none'} />
                                                    ) : '🎌'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{p.name}</div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ID: {p.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{p.category}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{p.anime}</td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>{formatPrice(p.price)}</div>
                                            {p.originalPrice > p.price && (
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{formatPrice(p.originalPrice)}</div>
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                className="admin-btn admin-btn--secondary"
                                                style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem', color: p.stock <= 10 ? 'var(--accent-red)' : 'var(--text-primary)' }}
                                                onClick={() => setStockModal({ product: p, newStock: p.stock })}
                                            >
                                                📦 {p.stock}
                                            </button>
                                        </td>
                                        <td>
                                            {p.badge ? (
                                                <span className={`admin-badge admin-badge--${p.badge.toLowerCase()}`}>{p.badge}</span>
                                            ) : (
                                                <span className="admin-badge admin-badge--none">—</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="admin-actions">
                                                <button className="admin-btn admin-btn--icon" title="Edit" onClick={() => openEdit(p)}>✏️</button>
                                                <button className="admin-btn admin-btn--icon" title="Delete" onClick={() => setDeleteConfirm(p)}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.78rem', borderTop: '1px solid var(--border-subtle)' }}>
                    Showing {filtered.length} of {products.length} products
                </div>
            </div>

            {/* ── Add/Edit Modal ── */}
            {modalOpen && (
                <div className="admin-modal-backdrop" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
                    <div className="admin-modal admin-modal--lg">
                        <div className="admin-modal__header">
                            <span className="admin-modal__title">{editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}</span>
                            <button className="admin-modal__close" onClick={() => setModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="admin-modal__body">
                                <div className="admin-form-grid" style={{ gap: '1rem' }}>
                                    <div className="admin-field admin-form-col-span">
                                        <label>Product Name *</label>
                                        <input value={form.name} onChange={fc('name')} required placeholder="e.g. Naruto Sage Mode Figure" />
                                    </div>
                                    <div className="admin-field">
                                        <label>Category *</label>
                                        <select value={form.category} onChange={fc('category')}>
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="admin-field">
                                        <label>Anime *</label>
                                        <input value={form.anime} onChange={fc('anime')} required placeholder="e.g. Naruto" />
                                    </div>
                                    <div className="admin-field">
                                        <label>Price (₹) *</label>
                                        <input type="number" min="0" value={form.price} onChange={fc('price')} required />
                                    </div>
                                    <div className="admin-field">
                                        <label>Original Price / MRP (₹)</label>
                                        <input type="number" min="0" value={form.originalPrice} onChange={fc('originalPrice')} />
                                    </div>
                                    <div className="admin-field">
                                        <label>Stock *</label>
                                        <input type="number" min="0" value={form.stock} onChange={fc('stock')} required />
                                    </div>
                                    <div className="admin-field">
                                        <label>Badge</label>
                                        <select value={form.badge} onChange={fc('badge')}>
                                            {BADGES.map(b => <option key={b} value={b}>{b || 'None'}</option>)}
                                        </select>
                                    </div>
                                    <div className="admin-field">
                                        <label>Rating (0–5)</label>
                                        <input type="number" min="0" max="5" step="any" value={form.rating} onChange={fc('rating')} />
                                    </div>
                                    <div className="admin-field">
                                        <label>Reviews Count</label>
                                        <input type="number" min="0" value={form.reviews} onChange={fc('reviews')} />
                                    </div>
                                    <div className="admin-field admin-form-col-span">
                                        <label>Description</label>
                                        <textarea value={form.description} onChange={fc('description')} placeholder="Product description..." rows={3} />
                                    </div>
                                    <div className="admin-field admin-form-col-span">
                                        <label>Tags (comma separated)</label>
                                        <input value={form.tags} onChange={fc('tags')} placeholder="naruto, action-figure, bandai" />
                                    </div>
                                    <div className="admin-field admin-form-col-span">
                                        <label>Image URL</label>
                                        <input value={form.image} onChange={fc('image')} placeholder="https://..." />
                                    </div>
                                </div>
                            </div>
                            <div className="admin-modal__footer">
                                <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                                <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
                                    {saving ? '⏳ Saving...' : (editingProduct ? '✅ Save Changes' : '➕ Add Product')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm ── */}
            {deleteConfirm && (
                <div className="admin-modal-backdrop" onClick={e => e.target === e.currentTarget && setDeleteConfirm(null)}>
                    <div className="admin-modal admin-modal--sm">
                        <div className="admin-modal__header">
                            <span className="admin-modal__title">🗑️ Confirm Delete</span>
                            <button className="admin-modal__close" onClick={() => setDeleteConfirm(null)}>✕</button>
                        </div>
                        <div className="admin-modal__body">
                            <p className="admin-confirm-text">
                                Are you sure you want to delete <span className="admin-confirm-highlight">"{deleteConfirm.name}"</span>? This cannot be undone.
                            </p>
                        </div>
                        <div className="admin-modal__footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="admin-btn admin-btn--danger" onClick={handleDelete}>🗑️ Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Stock Modal ── */}
            {stockModal && (
                <div className="admin-modal-backdrop" onClick={e => e.target === e.currentTarget && setStockModal(null)}>
                    <div className="admin-modal admin-modal--sm">
                        <div className="admin-modal__header">
                            <span className="admin-modal__title">📦 Update Stock</span>
                            <button className="admin-modal__close" onClick={() => setStockModal(null)}>✕</button>
                        </div>
                        <div className="admin-modal__body">
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                {stockModal.product.name}
                            </p>
                            <div className="admin-field">
                                <label>New Stock Quantity</label>
                                <input
                                    type="number" min="0" autoFocus
                                    value={stockModal.newStock}
                                    onChange={e => setStockModal(s => ({ ...s, newStock: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="admin-modal__footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setStockModal(null)}>Cancel</button>
                            <button className="admin-btn admin-btn--primary" onClick={handleStockSave}>✅ Update</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
