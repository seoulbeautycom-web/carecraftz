---
description: Deploy to Vercel
tags: [deployment, vercel, production]
---

# Vercel Deployment Only

**IMPORTANT: We ONLY use Vercel for deployment. Never use Netlify.**

## Main Site (carecraftz.com)

Build command: `npm run build`
Output directory: `dist/`

## Admin Portal (admin.carecraftz.com)

Build command: `npm run build:admin`
Output directory: `dist-admin/`

## Deployment Steps

1. Build the project
2. Deploy using Vercel CLI or Git push (Vercel auto-deploys from GitHub)

## Environment

- Framework: Vite + React + TypeScript
- Deployment Platform: Vercel ONLY
- NEVER create netlify.toml or use Netlify
