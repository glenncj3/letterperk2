# Open Graph Image Setup

## Current Setup

The Open Graph image is configured to use **absolute URLs** by default:
- Default: `https://letterperk.com/og-image.svg?v={timestamp}`
- Uses timestamp-based cache-busting to force refreshes

## For Production Deployment

The build automatically uses `https://letterperk.com` as the base URL. To override this, set the `VITE_OG_BASE_URL` environment variable:

```bash
# Example for Netlify/Vercel
VITE_OG_BASE_URL=https://letterperk.com
```

You can also set `VITE_OG_CACHE_BUSTER` to a specific value instead of using the build timestamp.

## Clearing Social Media Cache

Social media platforms cache Open Graph metadata aggressively. After deploying, you **must** clear the cache on each platform:

### Facebook/Meta
1. Go to [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
2. Enter your site URL
3. Click "Debug"
4. Click "Scrape Again" to force refresh

### Twitter/X
1. Go to [Twitter Card Validator](https://cards-dev.twitter.com/validator)
2. Enter your site URL
3. Click "Preview card"
4. This forces Twitter to re-fetch the metadata

### LinkedIn
1. Go to [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
2. Enter your site URL
3. Click "Inspect"

### Discord (Most Difficult)
Discord caches Open Graph images **very aggressively** and has no public debugger. Here's what to try:

1. **Deploy with new cache-busting parameter**: The build uses a timestamp, so each new build should have a unique URL
2. **Wait 24-48 hours**: Discord's cache can take a full day to clear
3. **Try a different URL path**: If possible, temporarily rename the image file (e.g., `og-image-v2.svg`) and update the meta tags
4. **Verify image accessibility**: Make sure `https://letterperk.com/og-image.svg` loads directly in a browser
5. **Check meta tags**: View page source on your deployed site and verify the `og:image` meta tag has the absolute URL

**Note**: Discord may show the old image for up to 48 hours even after everything is correct. This is normal Discord behavior.

### Other Platforms
- **Slack**: May take 24-48 hours, or try adding a query parameter

## Verifying the Image

1. Check that `/og-image.svg` is accessible at your deployed URL
2. Verify the image loads: `https://yourdomain.com/og-image.svg`
3. Check the HTML source to confirm meta tags are correct

## Troubleshooting

- **Still seeing old image**: Clear cache on the platform (see above)
- **Image not loading**: Verify the file exists in `public/` and is deployed
- **Relative path issues**: Set `VITE_OG_BASE_URL` environment variable for absolute URLs

