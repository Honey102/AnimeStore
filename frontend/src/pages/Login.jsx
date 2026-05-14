import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ToastContext } from '../App';
import './Auth.css';

export default function Login() {
    const { login, user, loading: authLoading } = useAuth();
    const { addToast } = useContext(ToastContext);
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/';

    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);

    useEffect(() => {
        if (user && !authLoading) {
            navigate(from, { replace: true });
        }
    }, [user, authLoading, navigate, from]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(form.email, form.password);
            addToast(data.message, 'success');
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-bg">
                <div className="auth-orb auth-orb--1" />
                <div className="auth-orb auth-orb--2" />
            </div>

            <div className="auth-card">
                {/* Header */}
                <div className="auth-card__header">
                    <Link to="/" className="auth-logo">⛩️ AnimeStore</Link>
                    <h1 className="auth-title">Welcome Back!</h1>
                    <p className="auth-subtitle">Login to access your profile, wishlist & orders</p>
                </div>

                {/* Error */}
                {error && <div className="auth-error">⚠️ {error}</div>}

                {/* Form */}
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="login-email">Email Address</label>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="your@email.com"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="login-password">Password</label>
                        <div className="input-with-icon">
                            <input
                                id="login-password"
                                type={showPass ? 'text' : 'password'}
                                placeholder="Your password"
                                value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                required
                            />
                            <button type="button" className="toggle-pass" onClick={() => setShowPass(s => !s)}>
                                {showPass ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg auth-submit"
                        disabled={loading}
                        id="login-submit-btn"
                    >
                        {loading ? <span className="btn-spinner" /> : '🎌 Login'}
                    </button>
                </form>

                {/* Footer */}
                <div className="auth-footer">
                    <p>Don't have an account? <Link to="/signup" className="auth-link">Sign Up Free</Link></p>
                    <Link to="/" className="auth-link" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
