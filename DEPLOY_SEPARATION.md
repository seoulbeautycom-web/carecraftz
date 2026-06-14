# CareCraftz Site Separation Strategy

## Overview
We've separated the customer-facing site from the admin portal for security and maintainability.

## Structure

### Main Site (carecraftz.com)
- **Build Command**: `npm run build`
- **Output**: `dist/` folder
- **Entry**: `index.html` → `src/main.tsx` → `App.tsx`
- **Contains**: All customer pages (Home, Shop, Product, Checkout, Profile, etc.)
- **Does NOT contain**: Any admin code or routes

### Admin Portal (admin.carecraftz.com)
- **Build Command**: `npm run build:admin`
- **Output**: `dist-admin/` folder
- **Entry**: `admin.html` → `src/admin-main.tsx` → `AdminApp.tsx`
- **Contains**: Only admin pages (Dashboard, Orders, Products, Staff, Settings)
- **Protected**: All routes require authentication via `ProtectedRoute`

## Deployment Setup

### 1. Main Site (carecraftz.com)
In Vercel dashboard for main project:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Root Directory**: `./`

### 2. Admin Portal (admin.carecraftz.com)
Create NEW Vercel project for admin:
- **Project Name**: `carecraftz-admin`
- **Build Command**: `npm run build:admin`
- **Output Directory**: `dist-admin`
- **Root Directory**: `./`
- **Framework Preset**: Vite

Add custom domain:
- Go to Settings → Domains
- Add `admin.carecraftz.com`
- Update DNS A record pointing to Vercel

## Security Measures

### Admin Portal
1. **No Admin Routes on Main Site**: Main App.tsx has zero admin code
2. **ProtectedRoute**: All admin pages require authentication
3. **Separate Authentication**: Admin uses same Supabase auth but isolated
4. **Noindex Meta Tag**: `admin.html` has `<meta name="robots" content="noindex, nofollow">`
5. **Vercel Headers**: `vercel-admin.json` blocks search engines

### Additional Protection (Recommended)
1. **IP Whitelisting**: Configure in Vercel or Cloudflare
2. **Basic Auth**: Add Vercel password protection for extra layer
3. **Rate Limiting**: Implement on Supabase Edge Functions

## Development Commands

```bash
# Run main site locally
npm run dev

# Run admin portal locally
npm run dev:admin

# Build main site
npm run build

# Build admin portal
npm run build:admin

# Build both
npm run build:all
```

## Git Repository
Both sites share the same codebase but build different outputs:
- Same repo: `carecraftz-standalone`
- Same branch: `main`
- Separate Vercel projects with different build commands

## Migration Steps

1. Deploy main site first (already done)
2. Create new Vercel project for admin
3. Link to same GitHub repo
4. Set build command to `npm run build:admin`
5. Add `admin.carecraftz.com` domain
6. Update DNS

## Why This Approach?

✅ **Security**: Main site customers cannot access admin code
✅ **Performance**: Main site bundle excludes all admin components
✅ **Maintenance**: Can deploy changes to one without affecting the other
✅ **Isolation**: Admin issues won't crash the customer site
✅ **Scalability**: Can scale/admin resources independently
