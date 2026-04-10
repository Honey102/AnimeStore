import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ToastContext } from '../App';
import './Footer.css';

export default function Footer() {
    const { addToast } = useContext(ToastContext);

    const comingSoon = (e) => {
        e.preventDefault();
        addToast('This page is coming soon! 🚀', 'info');
    };

    return (
        <footer className="footer">
            <div className="footer__glow" />
            <div className="container footer__inner">
                <div className="footer__brand">
                    <Link to="/" className="footer__logo">⛩️ AnimeStore</Link>
                    <p className="footer__tagline">Your ultimate destination for premium anime merchandise. Straight from the anime world to your doorstep. 🎌</p>
                    <div className="footer__socials">
                        {[
                            { icon: '🐦', label: 'Twitter' },
                            { icon: '📸', label: 'Instagram' },
                            { icon: '💬', label: 'Discord' },
                            { icon: '▶️', label: 'YouTube' },
                        ].map((s) => (
                            <a key={s.label} href="#" className="social-btn" aria-label={s.label} onClick={comingSoon}>{s.icon}</a>
                        ))}
                    </div>
                </div>

                <div className="footer__links-group">
                    <h4>Shop</h4>
                    <Link to="/shop/action-figures">Action Figures</Link>
                    <Link to="/shop/keychains">Keychains</Link>
                    <Link to="/shop/posters">Posters</Link>
                    <Link to="/shop/clothing">Clothing</Link>
                    <Link to="/shop/accessories">Accessories</Link>
                </div>

                <div className="footer__links-group">
                    <h4>Anime</h4>
                    <Link to="/shop?search=naruto">Naruto</Link>
                    <Link to="/shop?search=one+piece">One Piece</Link>
                    <Link to="/shop?search=demon+slayer">Demon Slayer</Link>
                    <Link to="/shop?search=dragon+ball">Dragon Ball</Link>
                    <Link to="/shop?search=attack+on+titan">Attack on Titan</Link>
                </div>

                <div className="footer__links-group">
                    <h4>Info</h4>
                    <Link to="/about">About Us</Link>
                    <a href="#" onClick={comingSoon}>Shipping Policy</a>
                    <a href="#" onClick={comingSoon}>Returns &amp; Refunds</a>
                    <a href="#" onClick={comingSoon}>Track Order</a>
                    <a href="#" onClick={comingSoon}>Contact Us</a>
                </div>
            </div>

            <div className="footer__badges container">
                {['100% Authentic', 'Secure Payments', 'Fast Shipping', '7-Day Returns'].map(badge => (
                    <div className="footer__badge" key={badge}>{badge}</div>
                ))}
            </div>

            <div className="footer__bottom container">
                <p>© {new Date().getFullYear()} AnimeStore. Made with ❤️ for anime fans.</p>
                <div className="footer__payment-icons">
                    {['💳', '📱', '🏦'].map((icon, i) => (
                        <span key={i} className="payment-icon">{icon}</span>
                    ))}
                </div>
            </div>
        </footer>
    );
}
