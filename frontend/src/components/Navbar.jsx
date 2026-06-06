import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

const categories = [
    { path: '/shop/action-figures', label: 'Action Figures', icon: '🗡️' },
    { path: '/shop/keychains', label: 'Keychains', icon: '🔑' },
    { path: '/shop/posters', label: 'Posters', icon: '🖼️' },
    { path: '/shop/clothing', label: 'Clothing', icon: '👕' },
    { path: '/shop/accessories', label: 'Accessories', icon: '✨' },
];

export default function Navbar() {
    const { count, toggleCart } = useCart();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target))
                setUserMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchCloseTimer = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [location]);

    return (
        <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
            <div className="navbar__inner container">

                {/* Logo */}
                <Link to="/" className="navbar__logo">
                    <span className="navbar__logo-icon">⛩️</span>
                    <span className="navbar__logo-text">
                        Anime<span>Store</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="navbar__nav">
                    <Link to="/" className={`navbar__link ${location.pathname === '/' ? 'active' : ''}`}>
                        Home
                    </Link>
                    <div className="navbar__dropdown">
                        <Link to="/shop" className={`navbar__link ${location.pathname.startsWith('/shop') ? 'active' : ''}`}>
                            Shop <span className="dropdown-arrow">▾</span>
                        </Link>
                        <div className="navbar__dropdown-menu">
                            <Link to="/shop" className="dropdown-item">All Products</Link>
                            {categories.map(c => (
                                <Link key={c.path} to={c.path} className="dropdown-item">
                                    <span>{c.icon}</span> {c.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <Link to="/about" className={`navbar__link ${location.pathname === '/about' ? 'active' : ''}`}>
                        About
                    </Link>
                </nav>

                {/* Right Action Buttons */}
                <div className="navbar__actions">
                    <div
                        className="navbar__search-wrapper"
                        onMouseEnter={() => {
                            clearTimeout(searchCloseTimer.current);
                            setSearchOpen(true);
                        }}
                        onMouseLeave={() => {
                            // Debounce: give 200ms before closing so cursor
                            // can move from icon → input without the bar closing
                            searchCloseTimer.current = setTimeout(() => setSearchOpen(false), 200);
                        }}
                    >
                        <button
                            className="navbar__icon-btn"
                            aria-label="Search"
                            id="search-btn"
                        >
                            🔍
                        </button>
                        {searchOpen && (
                            <div className="navbar__search-bar">
                                <input
                                    autoFocus
                                    type="search"
                                    placeholder="Search anime products..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && searchQuery.trim()) {
                                            navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
                                            setSearchQuery('');
                                            setSearchOpen(false);
                                        }
                                        if (e.key === 'Escape') setSearchOpen(false);
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Theme Toggle */}
                    <button
                        className="navbar__theme-btn"
                        onClick={toggleTheme}
                        id="theme-toggle-btn"
                        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        <span className={`theme-icon ${theme === 'dark' ? 'theme-icon--moon' : 'theme-icon--sun'}`}>
                            {theme === 'dark' ? '🌙' : '☀️'}
                        </span>
                    </button>

                    <button
                        className="navbar__cart-btn"
                        onClick={toggleCart}
                        id="cart-toggle-btn"
                        aria-label={`Cart with ${count} items`}
                    >
                        🛒
                        {count > 0 && (
                            <span className="navbar__cart-badge" key={count}>{count > 99 ? '99+' : count}</span>
                        )}
                    </button>

                    {/* User section */}
                    {user ? (
                        <div className="navbar__user" ref={userMenuRef}>
                            <button
                                className="navbar__user-btn"
                                onClick={() => setUserMenuOpen(o => !o)}
                                id="user-menu-btn"
                                aria-label="User menu"
                            >
                                <img
                                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=b6e3f4`}
                                    alt={user.name}
                                    className="navbar__avatar"
                                />
                                <span className="navbar__user-name">{user.name.split(' ')[0]}</span>
                                <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>▾</span>
                            </button>
                            {userMenuOpen && (
                                <div className="navbar__user-menu">
                                    <div className="user-menu-header">
                                        <span>👋 {user.name}</span>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user.email}</span>
                                    </div>
                                    <Link to="/profile" className="user-menu-item" onClick={() => setUserMenuOpen(false)}>👤 My Profile</Link>
                                    <Link to="/profile" state={{ tab: 'orders' }} className="user-menu-item" onClick={() => setUserMenuOpen(false)}>📦 Orders</Link>
                                    <Link to="/profile" state={{ tab: 'wishlist' }} className="user-menu-item" onClick={() => setUserMenuOpen(false)}>❤️ Wishlist</Link>
                                    <div className="user-menu-divider" />
                                    <button className="user-menu-item user-menu-logout" onClick={() => { logout(); setUserMenuOpen(false); }}>🚪 Logout</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className="btn btn-secondary btn-sm navbar__login-btn" id="nav-login-btn">
                            Login
                        </Link>
                    )}

                    {/* Mobile hamburger */}
                    <button
                        className={`navbar__hamburger ${mobileOpen ? 'open' : ''}`}
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Menu"
                        id="mobile-menu-btn"
                    >
                        <span /><span /><span />
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`navbar__mobile-menu ${mobileOpen ? 'open' : ''}`}>
                <Link to="/" className="mobile-link">🏠 Home</Link>
                <Link to="/shop" className="mobile-link">🎌 All Products</Link>
                {categories.map(c => (
                    <Link key={c.path} to={c.path} className="mobile-link">
                        {c.icon} {c.label}
                    </Link>
                ))}
                <Link to="/about" className="mobile-link">ℹ️ About</Link>
                <div className="mobile-menu-divider" />
                <button
                    className="mobile-link mobile-theme-btn"
                    onClick={toggleTheme}
                    id="mobile-theme-toggle-btn"
                >
                    {theme === 'dark' ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}
                </button>
                <button className="mobile-link mobile-cart-btn" onClick={() => { toggleCart(); setMobileOpen(false); }}>
                    🛒 Cart {count > 0 && <span className="mobile-cart-count">{count}</span>}
                </button>
                {user ? (
                    <>
                        <Link to="/profile" className="mobile-link" onClick={() => setMobileOpen(false)}>👤 My Profile</Link>
                        <Link to="/profile" state={{ tab: 'orders' }} className="mobile-link" onClick={() => setMobileOpen(false)}>📦 Orders</Link>
                        <Link to="/profile" state={{ tab: 'wishlist' }} className="mobile-link" onClick={() => setMobileOpen(false)}>❤️ Wishlist</Link>
                        <button className="mobile-link mobile-logout-btn" onClick={() => { logout(); setMobileOpen(false); }}>🚪 Logout</button>
                    </>
                ) : (
                    <Link to="/login" className="mobile-link" onClick={() => setMobileOpen(false)}>🔑 Login / Sign Up</Link>
                )}
            </div>
        </header>
    );
}
