import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartSidebar from './components/CartSidebar';
import Toast from './components/Toast';
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

export const ToastContext = React.createContext();

export default function App() {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            <AuthProvider>
                <CartProvider>
                    <BrowserRouter>
                        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                            <Navbar />
                            <CartSidebar />
                            <main style={{ flex: 1 }}>
                                <Routes>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/shop" element={<Shop />} />
                                    <Route path="/shop/:category" element={<Shop />} />
                                    <Route path="/product/:id" element={<ProductDetail />} />
                                    <Route path="/cart" element={<Cart />} />
                                    <Route path="/checkout" element={<Checkout />} />
                                    <Route path="/about" element={<About />} />
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/signup" element={<Signup />} />
                                    <Route path="/profile" element={<Profile />} />
                                    <Route path="*" element={<NotFound />} />
                                </Routes>
                            </main>
                            <Footer />
                            <div className="toast-container">
                                {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} />)}
                            </div>
                        </div>
                    </BrowserRouter>
                </CartProvider>
            </AuthProvider>
        </ToastContext.Provider>
    );
}
