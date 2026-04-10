import React from 'react';

export default function Toast({ message, type = 'success' }) {
    const icons = { success: '✅', error: '❌', info: '🔔', warning: '⚠️' };
    return (
        <div className={`toast toast--${type}`}>
            <span>{icons[type] || '✅'}</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{message}</span>
        </div>
    );
}
