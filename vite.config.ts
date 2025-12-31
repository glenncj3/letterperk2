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
        
        // Get GA Measurement ID - if not set, remove the script tag
        const gaMeasurementId = process.env.VITE_GA_MEASUREMENT_ID;
        let transformedHtml = html
          .replace(/__OG_BASE_URL__/g, baseUrl)
          .replace(/__OG_IMAGE_URL__/g, imageUrl);
        
        if (gaMeasurementId) {
          transformedHtml = transformedHtml.replace(/__GA_MEASUREMENT_ID__/g, gaMeasurementId);
        } else {
          // Remove GA script tag if not configured
          transformedHtml = transformedHtml.replace(
            /<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=__GA_MEASUREMENT_ID__"><\/script>\n?/g,
            ''
          );
        }
        
        return transformedHtml;
      },
    },
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
