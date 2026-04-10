const jwt = require('jsonwebtoken');

const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || 'animestore_admin_jwt_2026_$';

/**
 * Middleware to protect admin-only API routes.
 * Expects: Authorization: Bearer <admin_token>
 */
function adminMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Admin access required. Please login.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, ADMIN_SECRET);
        if (decoded.role !== 'admin') throw new Error('Not admin');
        req.admin = decoded;
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired admin token. Please login again.' });
    }
}

module.exports = { adminMiddleware, ADMIN_SECRET };
