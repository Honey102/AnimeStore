import React from 'react';
import './SkeletonCard.css';

export default function SkeletonCard() {
    return (
        <div className="product-card-skeleton">
            <div className="product-card-skeleton__image skeleton" />
            <div className="product-card-skeleton__body">
                <div className="product-card-skeleton__title skeleton" />
                <div className="product-card-skeleton__title--short skeleton" />
                <div className="product-card-skeleton__rating skeleton" />
                <div className="product-card-skeleton__price skeleton" />
            </div>
        </div>
    );
}

// Grid of N skeleton cards
export function SkeletonGrid({ count = 8 }) {
    return (
        <div className="products-grid">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}
