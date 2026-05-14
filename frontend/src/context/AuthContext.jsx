import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// In production (Vercel), use the Render backend URL.
// Priority: env variable → hardcoded Render URL → Vite proxy (local dev)
if (import.meta.env.VITE_API_URL) {
    axios.defaults.baseURL = import.meta.env.VITE_API_URL;
} else if (import.meta.env.PROD) {
    // Production build without env var — use hardcoded Render backend
    axios.defaults.baseURL = 'https://animestore-backend.onrender.com';
}

// Axios interceptor: attach JWT token to every request
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('animestore_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});


export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [wishlistIds, setWishlistIds] = useState([]);

    // On mount: restore session from localStorage
    useEffect(() => {
        const token = localStorage.getItem('animestore_token');
        const savedUser = localStorage.getItem('animestore_user');
        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
            // Fetch fresh profile + wishlist
            axios.get('/api/auth/profile')
                .then(r => {
                    setUser(r.data.user);
                    setWishlistIds(r.data.user.wishlist || []);
                    localStorage.setItem('animestore_user', JSON.stringify(r.data.user));
                })
                .catch(() => logout()) // Token expired
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const res = await axios.post('/api/auth/login', { email, password });
        localStorage.setItem('animestore_token', res.data.token);
        localStorage.setItem('animestore_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        setWishlistIds(res.data.user.wishlist || []);
        return res.data;
    };

    const register = async (name, email, password) => {
        const res = await axios.post('/api/auth/register', { name, email, password });
        localStorage.setItem('animestore_token', res.data.token);
        localStorage.setItem('animestore_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        setWishlistIds([]);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('animestore_token');
        localStorage.removeItem('animestore_user');
        setUser(null);
        setWishlistIds([]);
    };

    const updateProfile = async (data) => {
        const res = await axios.put('/api/auth/profile', data);
        setUser(res.data.user);
        localStorage.setItem('animestore_user', JSON.stringify(res.data.user));
        return res.data;
    };

    const toggleWishlist = async (productId) => {
        if (!user) return null;
        const res = await axios.post(`/api/auth/wishlist/${productId}`);
        setWishlistIds(res.data.wishlist);
        // sync user object using functional updater to avoid stale closure
        setUser(prevUser => {
            const updated = { ...prevUser, wishlist: res.data.wishlist };
            localStorage.setItem('animestore_user', JSON.stringify(updated));
            return updated;
        });
        return res.data;
    };

    const isWishlisted = (productId) => wishlistIds.includes(productId);

    return (
        <AuthContext.Provider value={{ user, loading, wishlistIds, login, register, logout, updateProfile, toggleWishlist, isWishlisted }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
};
