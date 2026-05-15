// Shared API base URL utility
// - Local dev: uses Vite proxy (no prefix needed) 
// - Production: uses Render backend URL
const API_BASE = 
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? 'https://animestore-aito.onrender.com' : '');

export default API_BASE;
