import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartSidebar from './components/CartSidebar';
import Toast from './components/Toast';

// ── Lazy load ALL pages — only downloaded when actually visited ──
const Home           = lazy(() => import('./pages/Home'));
const Shop           = lazy(() => import('./pages/Shop'));
const ProductDetail  = lazy(() => import('./pages/ProductDetail'));
const Cart           = lazy(() => import('./pages/Cart'));
const Checkout       = lazy(() => import('./pages/Checkout'));
const About          = lazy(() => import('./pages/About'));
const Login          = lazy(() => import('./pages/Login'));
const Signup         = lazy(() => import('./pages/Signup'));
const Profile        = lazy(() => import('./pages/Profile'));
const NotFound       = lazy(() => import('./pages/NotFound'));

// Admin pages — completely separate chunk
const AdminLogin      = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout     = lazy(() => import('./pages/admin/AdminLayout'));
const AdminOverview   = lazy(() => import('./pages/admin/AdminOverview'));
const AdminProducts   = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders     = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers      = lazy(() => import('./pages/admin/AdminUsers'));
const AdminOffers     = lazy(() => import('./pages/admin/AdminOffers'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminSettings   = lazy(() => import('./pages/admin/AdminSettings'));

export const ToastContext = React.createContext();

// ── Page loading fallback ──
function PageLoader() {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '60vh', flexDirection: 'column', gap: '1rem'
        }}>
            <div className="spinner" />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</span>
        </div>
    );
}

// ── Scroll to top on every route change ──
function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [pathname]);
    return null;
}

// ── Inner app: conditionally shows Navbar/Footer based on route ──
function AppContent({ toasts }) {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    return (
        <>
            <ScrollToTop />
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                {!isAdminRoute && <Navbar />}
                {!isAdminRoute && <CartSidebar />}

                <main style={{ flex: isAdminRoute ? 'none' : 1 }}>
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            {/* ── Main Site Routes ── */}
                            <Route path="/"              element={<Home />} />
                            <Route path="/shop"          element={<Shop />} />
                            <Route path="/shop/:category" element={<Shop />} />
                            <Route path="/product/:id"   element={<ProductDetail />} />
                            <Route path="/cart"          element={<Cart />} />
                            <Route path="/checkout"      element={<Checkout />} />
                            <Route path="/about"         element={<About />} />
                            <Route path="/login"         element={<Login />} />
                            <Route path="/signup"        element={<Signup />} />
                            <Route path="/profile"       element={<Profile />} />

                            {/* ── Admin Routes ── */}
                            <Route path="/admin/login" element={<AdminLogin />} />
                            <Route path="/admin" element={<AdminLayout />}>
                                <Route index          element={<AdminOverview />} />
                                <Route path="products"   element={<AdminProducts />} />
                                <Route path="orders"     element={<AdminOrders />} />
                                <Route path="users"      element={<AdminUsers />} />
                                <Route path="offers"     element={<AdminOffers />} />
                                <Route path="categories" element={<AdminCategories />} />
                                <Route path="settings"   element={<AdminSettings />} />
                            </Route>

                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Suspense>
                </main>

                {!isAdminRoute && <Footer />}

                {/* Toast container — always visible (position: fixed) */}
                <div className="toast-container">
                    {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} />)}
                </div>
            </div>
        </>
    );
}

export default function App() {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            <ThemeProvider>
                <AuthProvider>
                    <CartProvider>
                        <AdminProvider>
                            <BrowserRouter>
                                <AppContent toasts={toasts} />
                            </BrowserRouter>
                        </AdminProvider>
                    </CartProvider>
                </AuthProvider>
            </ThemeProvider>
        </ToastContext.Provider>
    );
}
