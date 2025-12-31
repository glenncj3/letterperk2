import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        // Use environment variable or default to letterperk.com for production
        const baseUrl = process.env.VITE_OG_BASE_URL || 'https://letterperk.com';
        // Use timestamp-based cache busting to force Discord to refresh
        const cacheBuster = process.env.VITE_OG_CACHE_BUSTER || Date.now();
        const imageUrl = `${baseUrl}/og-image.svg?v=${cacheBuster}`;
        return html.replace(/__OG_BASE_URL__/g, baseUrl).replace(/__OG_IMAGE_URL__/g, imageUrl);
      },
    },
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
