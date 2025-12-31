import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        const baseUrl = process.env.VITE_OG_BASE_URL || '';
        const imageUrl = baseUrl ? `${baseUrl}/og-image.svg?v=1` : '/og-image.svg?v=1';
        return html.replace(/__OG_BASE_URL__/g, baseUrl).replace(/__OG_IMAGE_URL__/g, imageUrl);
      },
    },
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
