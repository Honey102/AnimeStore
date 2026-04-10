import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartSidebar from './components/CartSidebar';
import Toast from './components/Toast';

// Main site pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import About from './pages/About';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Admin pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOffers from './pages/admin/AdminOffers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminSettings from './pages/admin/AdminSettings';

export const ToastContext = React.createContext();

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
            <AuthProvider>
                <CartProvider>
                    <AdminProvider>
                        <BrowserRouter>
                            <AppContent toasts={toasts} />
                        </BrowserRouter>
                    </AdminProvider>
                </CartProvider>
            </AuthProvider>
        </ToastContext.Provider>
    );
}
