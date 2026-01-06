# Cloudflare Workers - API Proxy (Optional)

This directory contains an optional Cloudflare Worker that can act as a proxy
between your Cloudflare Pages frontend and your backend API.

## Purpose

- Route API requests from Cloudflare Pages to your backend
- Add additional security headers
- Implement caching for certain endpoints
- Rate limiting

## Setup

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Configure `wrangler.toml` with your account details

4. Deploy:
   ```bash
   wrangler deploy
   ```

## Note

This is optional. You can also configure your frontend to connect directly
to your backend API if it's hosted on a separate server with proper CORS configuration.
