/**
 * AnimeStore — Shared Utilities
 */

/** Format a number as Indian Rupees (e.g. ₹1,299) */
export function formatPrice(p) {
    return `₹${p.toLocaleString('en-IN')}`;
}

/** Get discount percentage between original and current price */
export function getDiscount(original, current) {
    if (!original || original <= 0) return 0;
    return Math.round(((original - current) / original) * 100);
}

/** Get a category emoji by category id */
export function getCategoryEmoji(cat) {
    const map = {
        'action-figures': '🗡️',
        'keychains': '🔑',
        'posters': '🖼️',
        'clothing': '👕',
        'accessories': '✨',
    };
    return map[cat] || '🎌';
}
