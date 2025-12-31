# Open Graph Image Setup

## Current Setup

The Open Graph image is configured to use `/og-image.svg?v=1` (relative path with cache-busting).

## For Production Deployment

To use an absolute URL (recommended for better compatibility), set the `VITE_OG_BASE_URL` environment variable:

```bash
# Example for Netlify/Vercel
VITE_OG_BASE_URL=https://letterperk.com
```

This will automatically transform the image URLs to absolute paths during build.

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

### Other Platforms
- **Discord**: Usually updates within a few hours, or you can change the URL slightly (add `?v=2`)
- **Slack**: May take 24-48 hours, or try adding a query parameter

## Verifying the Image

1. Check that `/og-image.svg` is accessible at your deployed URL
2. Verify the image loads: `https://yourdomain.com/og-image.svg`
3. Check the HTML source to confirm meta tags are correct

## Troubleshooting

- **Still seeing old image**: Clear cache on the platform (see above)
- **Image not loading**: Verify the file exists in `public/` and is deployed
- **Relative path issues**: Set `VITE_OG_BASE_URL` environment variable for absolute URLs

