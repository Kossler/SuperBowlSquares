# Cloudflare Pages Deployment Guide

## Frontend Deployment (Cloudflare Pages)

### Prerequisites
- Cloudflare account
- GitHub repository connected to Cloudflare Pages

### Deployment Steps

1. **Build Configuration**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `frontend`

2. **Environment Variables** (Set in Cloudflare Pages dashboard)
   ```
   VITE_API_URL=https://your-backend-api.com/api
   ```

3. **Build Settings in Cloudflare Pages**
   - Framework preset: Vite
   - Node version: 18

### _headers file for CORS
Create `frontend/public/_headers`:
```
/*
  Access-Control-Allow-Origin: *
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

## Backend Deployment Options

### Option 1: Traditional Hosting (Recommended for Java)
Deploy the Spring Boot application to:
- AWS EC2
- Google Cloud Platform
- Azure App Service
- DigitalOcean Droplet

### Option 2: Cloudflare Workers (Requires Adaptation)
Note: Cloudflare Workers run JavaScript/TypeScript/WebAssembly, not Java directly.
You would need to:
1. Create a Node.js/TypeScript proxy worker
2. Host the Java backend elsewhere
3. Use the worker to route requests

### Option 3: Hybrid Approach
- Frontend: Cloudflare Pages
- Backend: Cloud provider with API
- Use Cloudflare as CDN and proxy

## Database Hosting
MySQL can be hosted on:
- AWS RDS
- Google Cloud SQL
- PlanetScale (MySQL-compatible)
- DigitalOcean Managed Databases

## Recommended Architecture

```
┌─────────────────────┐
│  Cloudflare Pages   │  (Frontend - React)
│  *.pages.dev        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Cloud Provider     │  (Backend - Spring Boot)
│  API Server         │
│  (AWS/GCP/Azure)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  MySQL Database     │
│  (RDS/Cloud SQL)    │
└─────────────────────┘
```

## Configuration Updates Needed

1. **Frontend**: Update `vite.config.js` to use environment variable for API URL
2. **Backend**: Update CORS settings to allow Cloudflare Pages domain
3. **Database**: Update connection string to point to hosted MySQL instance

## Security Considerations

- Use HTTPS for all connections
- Set up proper CORS headers
- Use environment variables for sensitive data
- Enable Cloudflare security features (WAF, DDoS protection)
- Implement rate limiting on backend
