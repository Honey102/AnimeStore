import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ToastContext } from '../App';
import './Auth.css';

export default function Signup() {
    const { register } = useAuth();
    const { addToast } = useContext(ToastContext);
    const navigate = useNavigate();

    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirm) {
            setError('Passwords do not match!');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            const data = await register(form.name, form.email, form.password);
            addToast(data.message, 'success');
            navigate('/profile');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Try again.');
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
                <div className="auth-card__header">
                    <Link to="/" className="auth-logo">⛩️ AnimeStore</Link>
                    <h1 className="auth-title">Join AnimeStore!</h1>
                    <p className="auth-subtitle">Create your account to get wishlist, order history & more</p>
                </div>

                {error && <div className="auth-error">⚠️ {error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="signup-name">Full Name</label>
                        <input
                            id="signup-name"
                            type="text"
                            placeholder="Naruto Uzumaki"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="signup-email">Email Address</label>
                        <input
                            id="signup-email"
                            type="email"
                            placeholder="your@email.com"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="signup-password">Password</label>
                        <div className="input-with-icon">
                            <input
                                id="signup-password"
                                type={showPass ? 'text' : 'password'}
                                placeholder="Min. 6 characters"
                                value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                required
                            />
                            <button type="button" className="toggle-pass" onClick={() => setShowPass(s => !s)}>
                                {showPass ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="signup-confirm">Confirm Password</label>
                        <input
                            id="signup-confirm"
                            type={showPass ? 'text' : 'password'}
                            placeholder="Repeat your password"
                            value={form.confirm}
                            onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                            required
                        />
                    </div>

                    {/* Password strength */}
                    {form.password && (
                        <div className="password-strength">
                            <div className="strength-bar">
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`strength-segment ${getStrength(form.password) > i ? `strength-${getStrengthLabel(form.password)}` : ''}`}
                                    />
                                ))}
                            </div>
                            <span className="strength-label">{getStrengthLabel(form.password)}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg auth-submit"
                        disabled={loading}
                        id="signup-submit-btn"
                    >
                        {loading ? <span className="btn-spinner" /> : '🎌 Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login" className="auth-link">Login</Link></p>
                    <Link to="/" className="auth-link" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

function getStrength(password) {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
}

function getStrengthLabel(password) {
    const s = getStrength(password);
    return ['weak', 'fair', 'good', 'strong'][s - 1] || 'weak';
}
