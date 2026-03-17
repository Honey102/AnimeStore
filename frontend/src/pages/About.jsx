import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './About.css';

const team = [
    { name: 'Arjun Sharma', role: 'Founder & CEO', emoji: '🎌', bio: 'Anime fan since Naruto was first aired. Started AnimeStore to give fellow fans authentic merchandise.' },
    { name: 'Priya Mehta', role: 'Head of Products', emoji: '⚔️', bio: 'One Piece superfan who handpicks every product to ensure quality and authenticity.' },
    { name: 'Rohan Das', role: 'Tech Lead', emoji: '🔮', bio: 'Dragon Ball fanatic who built this platform from scratch to bring you the best shopping experience.' },
];

const testimonials = [
    { name: 'Rahul M.', city: 'Mumbai', stars: 5, anime: '🍥 Naruto Fan', text: 'Got the Naruto Sage Mode figure and it\'s absolutely stunning! The detail is incredible, way better than I expected. Packaging was super secure too. Will definitely order again!', product: 'Naruto Uzumaki Figure', avatar: 'R' },
    { name: 'Priya K.', city: 'Delhi', stars: 5, anime: '⚔️ Demon Slayer Fan', text: 'Ordered the Akatsuki hoodie as a birthday gift for my brother and he went crazy! The quality of the fabric is amazing — thick, soft, and the print hasn\'t faded even after multiple washes.', product: 'Akatsuki Cloud Hoodie', avatar: 'P' },
    { name: 'Arjun S.', city: 'Bangalore', stars: 5, anime: '☠️ One Piece Fan', text: 'The Dragon Ball Seven Star Ball Set is a masterpiece! Looks exactly like in the anime. The display stand is a bonus. Perfect collector\'s item. Fast delivery to Bangalore — just 3 days!', product: 'Dragon Ball Star Set', avatar: 'A' },
    { name: 'Sneha R.', city: 'Chennai', stars: 5, anime: '🔮 Dragon Ball Fan', text: 'I was skeptical ordering online but AnimeStore completely changed my mind. The Tanjiro figure is authentic and the customer support was super helpful when I had a query. 10/10 experience!', product: 'Tanjiro & Nezuko Set', avatar: 'S' },
    { name: 'Vikram T.', city: 'Hyderabad', stars: 4, anime: '🏰 AoT Fan', text: 'Survey Corps hoodie is phenomenal! The embroidery on the back is incredibly detailed. Sizing runs a bit large so order a size down, but overall best anime merch I\'ve bought in India.', product: 'Survey Corps Hoodie', avatar: 'V' },
    { name: 'Ananya B.', city: 'Pune', stars: 5, anime: '🗡️ Collector', text: 'Finally found a store that sells AUTHENTIC anime merch in India at fair prices. The Naruto headband set is perfect — all 5 headbands are high quality metal. Fast shipping, great packaging!', product: 'Naruto Headband Set', avatar: 'A' },
];

const stats = [
    { value: '10,000+', label: 'Happy Customers' },
    { value: '30+', label: 'Products' },
    { value: '5', label: 'Anime Categories' },
    { value: '4.8/5', label: 'Average Rating' },
];

export default function About() {
    return (
        <div className="about-page">
            {/* Hero */}
            <section className="about-hero">
                <div className="container">
                    <div className="about-hero__pill">🎌 Our Story</div>
                    <h1 className="about-hero__title">Passion for Anime.<br />
                        <span>Built for Fans.</span>
                    </h1>
                    <p className="about-hero__subtitle">
                        AnimeStore was born from a simple belief: every anime fan deserves access to premium,
                        authentic merchandise that celebrates their favourite series. We're fans first, and a
                        business second.
                    </p>
                </div>
            </section>

            {/* Stats */}
            <section className="about-stats">
                <div className="container">
                    {stats.map(s => (
                        <div key={s.label} className="about-stat">
                            <span className="about-stat__value">{s.value}</span>
                            <span className="about-stat__label">{s.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Mission */}
            <section className="section">
                <div className="container about-mission">
                    <div className="mission-text">
                        <h2 className="section-title">Our Mission</h2>
                        <p>We exist to bring the anime world to life through high-quality, authentic merchandise.
                            Whether you're a beginner discovering Naruto for the first time, or a seasoned fan
                            who can recite every Devil Fruit from One Piece — AnimeStore is your home.</p>
                        <p>Every product in our store is carefully selected for quality, every delivery packed
                            with love, and every customer treated like a fellow fan.</p>
                        <div className="mission-values">
                            {['🏆 Quality First', '❤️ Fan-Driven', '🌍 Total India Coverage', '⚡ Fast Shipping'].map(v => (
                                <span key={v} className="mission-value">{v}</span>
                            ))}
                        </div>
                    </div>
                    <div className="mission-visual">
                        <div className="mission-orb">⛩️</div>
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="section" style={{ background: 'var(--bg-secondary)' }}>
                <div className="container">
                    <div className="section-header">
                        <div>
                            <h2 className="section-title">Meet the Team</h2>
                            <p className="section-subtitle">Fellow anime fans who make this possible</p>
                        </div>
                    </div>
                    <div className="team-grid">
                        {team.map(m => (
                            <div key={m.name} className="team-card">
                                <div className="team-card__avatar">{m.emoji}</div>
                                <h4 className="team-card__name">{m.name}</h4>
                                <span className="team-card__role">{m.role}</span>
                                <p className="team-card__bio">{m.bio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="section about-testimonials-section">
                <div className="container">
                    <div className="section-header" style={{ marginBottom: '2.5rem' }}>
                        <div>
                            <h2 className="section-title">What Our Fans Say 💬</h2>
                            <p className="section-subtitle">Real reviews from real anime lovers across India</p>
                        </div>
                        <div className="testimonial-rating-summary">
                            <span className="trs-score">4.8</span>
                            <div>
                                <div className="trs-stars">★★★★★</div>
                                <div className="trs-count">Based on 10,000+ reviews</div>
                            </div>
                        </div>
                    </div>

                    {/* Featured big review */}
                    <div className="testimonial-featured">
                        <div className="tf-quote">❝</div>
                        <p className="tf-text">{testimonials[0].text}</p>
                        <div className="tf-author">
                            <div className="tf-avatar">{testimonials[0].avatar}</div>
                            <div>
                                <div className="tf-name">{testimonials[0].name} <span className="tf-city">· {testimonials[0].city}</span></div>
                                <div className="tf-stars">{'★'.repeat(testimonials[0].stars)}</div>
                            </div>
                            <span className="tf-anime-tag">{testimonials[0].anime}</span>
                        </div>
                    </div>

                    {/* Review cards grid */}
                    <div className="testimonials-grid">
                        {testimonials.slice(1).map((t, i) => (
                            <div key={i} className="testimonial-card">
                                <div className="tc-header">
                                    <div className="tc-avatar">{t.avatar}</div>
                                    <div className="tc-meta">
                                        <div className="tc-name">{t.name}</div>
                                        <div className="tc-city">{t.city}</div>
                                    </div>
                                    <div className="tc-stars">{'★'.repeat(t.stars)}{'☆'.repeat(5 - t.stars)}</div>
                                </div>
                                <p className="tc-text">{t.text}</p>
                                <div className="tc-product">🛍️ {t.product}</div>
                                <div className="tc-anime">{t.anime}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="about-cta">
                <div className="container about-cta__inner">
                    <h2>Ready to Shop? 🛒</h2>
                    <p>Explore our collection of 30+ premium anime products.</p>
                    <Link to="/shop" className="btn btn-primary btn-lg" id="about-shop-btn">
                        Browse All Products
                    </Link>
                </div>
            </section>
        </div>
    );
}
