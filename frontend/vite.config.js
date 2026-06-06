import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],

    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true
            },
            '/uploads': {
                target: 'http://localhost:5000',
                changeOrigin: true
            }
        }
    },

    build: {
        // Split vendor chunks for better browser caching
        rollupOptions: {
            output: {
                manualChunks: {
                    // React core — cached separately, rarely changes
                    'vendor-react': ['react', 'react-dom'],
                    // Router — cached separately
                    'vendor-router': ['react-router-dom'],
                    // HTTP client
                    'vendor-axios': ['axios'],
                },
            },
        },
        // Warn if any single chunk exceeds 400KB
        chunkSizeWarningLimit: 400,
    },
})
