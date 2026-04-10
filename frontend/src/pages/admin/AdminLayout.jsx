import React, { useContext } from 'react';
import { NavLink, Outlet, Navigate, useNavigate, Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { ToastContext } from '../../App';
import './Admin.css';

const NAV_ITEMS = [
    { to: '/admin',            icon: '📊', label: 'Overview',   end: true },
    { to: '/admin/products',   icon: '📦', label: 'Products'   },
    { to: '/admin/orders',     icon: '🧾', label: 'Orders'     },
    { to: '/admin/users',      icon: '👥', label: 'Users'      },
    { to: '/admin/offers',     icon: '⚡', label: 'Offers'     },
    { to: '/admin/categories', icon: '🗂️', label: 'Categories' },
    { to: '/admin/settings',   icon: '⚙️', label: 'Settings'   },
];

export default function AdminLayout() {
    const { isAdmin, adminLogout } = useAdmin();
    const { addToast } = useContext(ToastContext);
    const navigate = useNavigate();

    if (!isAdmin) return <Navigate to="/admin/login" replace />;

    const handleLogout = () => {
        adminLogout();
        addToast('Admin logged out.', 'info');
        navigate('/admin/login');
    };

    return (
        <div className="admin-layout">
            {/* ── Sidebar ── */}
            <aside className="admin-sidebar">
                <div className="admin-sidebar__brand">
                    <span style={{ fontSize: '1.4rem' }}>⛩️</span>
                    <div className="admin-sidebar__logo">
                        AnimeStore
                        <span>Admin Panel</span>
                    </div>
                </div>

                <nav className="admin-sidebar__nav">
                    {NAV_ITEMS.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `admin-nav-item${isActive ? ' active' : ''}`
                            }
                        >
                            <span className="admin-nav-item__icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="admin-sidebar__footer">
                    <Link
                        to="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-nav-item"
                    >
                        <span className="admin-nav-item__icon">🌐</span>
                        <span>View Site</span>
                    </Link>
                    <div className="admin-sidebar__divider" />
                    <button className="admin-nav-item admin-nav-item--danger" onClick={handleLogout}>
                        <span className="admin-nav-item__icon">🚪</span>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="admin-main">
                <Outlet />
            </main>
        </div>
    );
}
