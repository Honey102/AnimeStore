import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_ITEM': {
            const existing = state.items.find(i => i.id === action.payload.id);
            const maxStock = action.payload.stock ?? Infinity;
            // ✅ Fix: out-of-stock items should never be added
            if (maxStock <= 0) return state;
            if (existing) {
                // Don't exceed product stock
                if (existing.quantity >= maxStock) return state;
                return {
                    ...state,
                    items: state.items.map(i =>
                        i.id === action.payload.id
                            ? { ...i, quantity: i.quantity + 1 }
                            : i
                    )
                };
            }
            return { ...state, items: [...state.items, { ...action.payload, quantity: 1 }] };
        }
        case 'REMOVE_ITEM':
            return { ...state, items: state.items.filter(i => i.id !== action.payload) };
        case 'UPDATE_QUANTITY': {
            const { id, quantity } = action.payload;
            if (quantity <= 0) return { ...state, items: state.items.filter(i => i.id !== id) };
            return {
                ...state,
                items: state.items.map(i => i.id === id ? { ...i, quantity } : i)
            };
        }
        case 'CLEAR_CART':
            return { ...state, items: [] };
        case 'TOGGLE_CART':
            return { ...state, isOpen: !state.isOpen };
        case 'CLOSE_CART':
            return { ...state, isOpen: false };
        default:
            return state;
    }
};

const getInitialState = () => {
    try {
        const saved = localStorage.getItem('animestore_cart');
        if (saved) return { items: JSON.parse(saved), isOpen: false };
    } catch { }
    return { items: [], isOpen: false };
};

export function CartProvider({ children }) {
    const [state, dispatch] = useReducer(cartReducer, getInitialState());

    useEffect(() => {
        localStorage.setItem('animestore_cart', JSON.stringify(state.items));
    }, [state.items]);

    const totals = state.items.reduce(
        (acc, item) => ({
            count: acc.count + item.quantity,
            subtotal: acc.subtotal + item.price * item.quantity
        }),
        { count: 0, subtotal: 0 }
    );

    const addItem = (product) => dispatch({ type: 'ADD_ITEM', payload: product });
    const removeItem = (id) => dispatch({ type: 'REMOVE_ITEM', payload: id });
    const updateQuantity = (id, quantity) => dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
    const clearCart = () => dispatch({ type: 'CLEAR_CART' });
    const toggleCart = () => dispatch({ type: 'TOGGLE_CART' });
    const closeCart = () => dispatch({ type: 'CLOSE_CART' });

    return (
        <CartContext.Provider value={{
            items: state.items,
            isOpen: state.isOpen,
            count: totals.count,
            subtotal: totals.subtotal,
            addItem, removeItem, updateQuantity, clearCart, toggleCart, closeCart
        }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
};
