import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import API_BASE from '../utils/apiBase';

const AdminContext = createContext(null);

// Shared axios instance that auto-attaches admin token
const adminAPI = axios.create({
    baseURL: API_BASE
});

adminAPI.interceptors.request.use(config => {
    const token = sessionStorage.getItem('animestore_admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export function AdminProvider({ children }) {
    const [isAdmin, setIsAdmin] = useState(() => !!sessionStorage.getItem('animestore_admin_token'));

    const adminLogin = async (password) => {
        const res = await axios.post(`${API_BASE}/api/admin/login`, { password });
        sessionStorage.setItem('animestore_admin_token', res.data.token);
        setIsAdmin(true);
        return res.data;
    };

    const adminLogout = () => {
        sessionStorage.removeItem('animestore_admin_token');
        setIsAdmin(false);
    };

    return (
        <AdminContext.Provider value={{ isAdmin, adminLogin, adminLogout, adminAPI }}>
            {children}
        </AdminContext.Provider>
    );
}

export const useAdmin = () => {
    const ctx = useContext(AdminContext);
    if (!ctx) throw new Error('useAdmin must be used inside AdminProvider');
    return ctx;
};
