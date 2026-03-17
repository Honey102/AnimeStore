import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="notfound-page">
            <div className="notfound-bg">
                <div className="notfound-orb notfound-orb--1" />
                <div className="notfound-orb notfound-orb--2" />
            </div>
            <div className="notfound-content">
                <div className="notfound-code">404</div>
                <div className="notfound-emoji">🎌</div>
                <h1 className="notfound-title">Page Not Found!</h1>
                <p className="notfound-sub">
                    Looks like this page wandered off into another dimension...<br />
                    Even Naruto couldn't find it! 🍥
                </p>
                <div className="notfound-actions">
                    <button className="btn btn-primary btn-lg" onClick={() => navigate(-1)}>
                        ← Go Back
                    </button>
                    <Link to="/" className="btn btn-secondary btn-lg">
                        🏠 Home
                    </Link>
                    <Link to="/shop" className="btn btn-gold">
                        🛒 Shop
                    </Link>
                </div>
            </div>
        </div>
    );
}
