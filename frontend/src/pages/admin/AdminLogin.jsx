import React, { useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { ToastContext } from '../../App';
import './Admin.css';

export default function AdminLogin() {
    const { isAdmin, adminLogin } = useAdmin();
    const { addToast } = useContext(ToastContext);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (isAdmin) return <Navigate to="/admin" replace />;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await adminLogin(password);
            addToast('Welcome, Admin! 🎌', 'success');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid password. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-card">
                <div className="admin-login-icon">🔐</div>
                <h1 className="admin-login-title">Admin Access</h1>
                <p className="admin-login-sub">AnimeStore Control Panel 🎌</p>

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <div className="admin-field" style={{ marginBottom: '1rem' }}>
                        <label>Admin Password</label>
                        <input
                            id="admin-password"
                            type="password"
                            placeholder="Enter admin password..."
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <button
                        type="submit"
                        className="admin-btn admin-btn--primary"
                        style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
                        disabled={loading}
                    >
                        {loading ? '⏳ Logging in...' : '🔑 Login to Admin Panel'}
                    </button>
                </form>

                {error && <div className="admin-login-error">❌ {error}</div>}

                <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    This panel is for authorized administrators only.
                </p>
            </div>
        </div>
    );
}
