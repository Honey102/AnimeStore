import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import API_BASE from '../utils/apiBase';
import './Shop.css';

const CATEGORIES = [
    { id: 'all', label: 'All', icon: '🎌' },
    { id: 'action-figures', label: 'Action Figures', icon: '🗡️' },
    { id: 'keychains', label: 'Keychains', icon: '🔑' },
    { id: 'posters', label: 'Posters', icon: '🖼️' },
    { id: 'clothing', label: 'Clothing', icon: '👕' },
    { id: 'accessories', label: 'Accessories', icon: '✨' },
];

const SORT_OPTIONS = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Top Rated' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
];

export default function Shop() {
    const { category: urlCategory } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [count, setCount] = useState(0);

    const activeCategory = urlCategory || searchParams.get('category') || 'all';
    const searchQuery = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'popular';

    const [localSearch, setLocalSearch] = useState(searchQuery);

    // Debounce timer ref
    const debounceRef = useRef(null);

    const fetchProducts = useCallback(() => {
        setLoading(true);

        // Build URL with server-side filters — no client-side filtering needed!
        const params = new URLSearchParams();
        if (activeCategory !== 'all') params.set('category', activeCategory);
        if (searchQuery) params.set('search', searchQuery);
        if (sort) params.set('sort', sort);

        fetch(`${API_BASE}/api/products?${params.toString()}`)
            .then(r => r.json())
            .then(data => {
                setProducts(data.products || []);
                setCount(data.count || 0);
            })
            .catch(() => {
                setProducts([]);
                setCount(0);
            })
            .finally(() => setLoading(false));
    }, [activeCategory, searchQuery, sort]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);
    useEffect(() => { setLocalSearch(searchQuery); }, [searchQuery]);

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams);
        if (localSearch.trim()) params.set('search', localSearch.trim());
        else params.delete('search');
        setSearchParams(params);
    };

    // Live search with debounce (300ms)
    const handleSearchInput = (e) => {
        const val = e.target.value;
        setLocalSearch(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            if (val.trim()) params.set('search', val.trim());
            else params.delete('search');
            setSearchParams(params);
        }, 300);
    };

    const navigate = useNavigate();

    const handleCategoryClick = (catId) => {
        const params = new URLSearchParams();
        if (sort) params.set('sort', sort);
        if (searchQuery) params.set('search', searchQuery);
        if (catId === 'all') {
            navigate(`/shop${params.toString() ? '?' + params.toString() : ''}`);
        } else {
            navigate(`/shop/${catId}${params.toString() ? '?' + params.toString() : ''}`);
        }
    };

    const handleSort = (e) => {
        const params = new URLSearchParams(searchParams);
        params.set('sort', e.target.value);
        setSearchParams(params);
    };

    const activeCat = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];

    return (
        <div className="shop">
            {/* Page header */}
            <div className="shop__header">
                <div className="container shop__header-inner">
                    <div>
                        <nav className="breadcrumb">
                            <Link to="/">Home</Link> / <Link to="/shop">Shop</Link>
                            {activeCategory !== 'all' && <> / <span>{activeCat.label}</span></>}
                        </nav>
                        <h1 className="shop__title">
                            {activeCat.icon} {searchQuery ? `Results for "${searchQuery}"` : activeCat.label}
                        </h1>
                        <p className="shop__count">
                            {loading ? 'Loading...' : `${count} product${count !== 1 ? 's' : ''} found`}
                        </p>
                    </div>
                    {/* Search bar */}
                    <form className="shop__search" onSubmit={handleSearch}>
                        <input
                            type="search"
                            placeholder="Search products, anime, characters..."
                            value={localSearch}
                            onChange={handleSearchInput}
                            id="shop-search-input"
                        />
                        <button type="submit" className="btn btn-primary btn-sm">Search</button>
                    </form>
                </div>
            </div>

            <div className="container shop__body">
                {/* Sidebar */}
                <aside className="shop__sidebar">
                    <div className="sidebar-section">
                        <h3 className="sidebar-title">Categories</h3>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                className={`sidebar-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
                                onClick={() => handleCategoryClick(cat.id)}
                                id={`filter-${cat.id}`}
                            >
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Main content */}
                <div className="shop__main">
                    {/* Toolbar */}
                    <div className="shop__toolbar">
                        <div className="active-filters">
                            {activeCategory !== 'all' && (
                                <span className="filter-tag">
                                    {activeCat.icon} {activeCat.label}
                                    <button onClick={() => handleCategoryClick('all')}>✕</button>
                                </span>
                            )}
                            {searchQuery && (
                                <span className="filter-tag">
                                    🔍 "{searchQuery}"
                                    <button onClick={() => {
                                        setLocalSearch('');
                                        const params = new URLSearchParams(searchParams);
                                        params.delete('search');
                                        setSearchParams(params);
                                    }}>✕</button>
                                </span>
                            )}
                        </div>
                        <div className="shop__sort">
                            <label htmlFor="sort-select">Sort by:</label>
                            <select id="sort-select" value={sort} onChange={handleSort}>
                                {SORT_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="spinner-wrapper">
                            <div className="spinner" />
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="shop__empty">
                            <div style={{ fontSize: '4rem' }}>😢</div>
                            <h3>No products found</h3>
                            <p>Try adjusting your search or filters</p>
                            <button className="btn btn-primary" onClick={() => { setSearchParams({}); setLocalSearch(''); }}>
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <div className="products-grid">
                            {products.map(p => <ProductCard key={p.id} product={p} />)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
