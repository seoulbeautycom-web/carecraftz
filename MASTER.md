# MASTER DEPLOYMENT GUIDE - CARECRAFTZ

## ⚠️ CRITICAL RULES - NEVER VIOLATE

### 1. DEPLOYMENT PLATFORM
- **ONLY VERCEL** - admin.carecraftz.com and carecraftz.com
- **NEVER NETLIFY** - Netlify is poison, never touch it
- **NO EXCEPTIONS EVER**

### 2. DEPLOYMENT WORKFLOW (AUTOMATED)
```
Code Changes → Git Push → GitHub → GitHub Actions → Vercel Auto-Deploy
```

**NEVER ask user to run commands** - Everything is automated via:
- GitHub repository: seoulbeautycom-web/carecraftz
- GitHub Actions (already configured)
- Vercel connected to GitHub
- Supabase integration via actions

### 3. WHEN CHANGES ARE READY
1. Stage: `git add -A`
2. Commit: `git commit -m "description"`
3. Push: `git push origin main`
4. **Vercel auto-deploys** - no manual intervention needed

### 4. PROJECT STRUCTURE
- **Main site**: carecraftz.com (dist/)
- **Admin portal**: admin.carecraftz.com (dist-admin/)
- **Build commands**:
  - Main: `npm run build` → dist/
  - Admin: `npm run build:admin` → dist-admin/

### 5. SUPABASE
- Already integrated
- Auto-deploys with GitHub Actions
- Tables, auth, storage all handled

### 6. WHAT TO NEVER DO
- ❌ Never mention Netlify
- ❌ Never ask user to run commands manually
- ❌ Never create netlify.toml
- ❌ Never use deploy_web_app tool (it forces Netlify)
- ❌ Never rush - think first

### 7. WHAT TO ALWAYS DO
- ✅ Push to GitHub, let automation handle rest
- ✅ Verify changes are committed before saying "done"
- ✅ Check git status if uncertain
- ✅ Be patient and methodical

---

## ARCHITECTURE SUMMARY

**Frontend**: React + Vite + TypeScript + Tailwind CSS  
**Backend**: Supabase (PostgreSQL, Auth, Storage)  
**Hosting**: Vercel (main + admin subdomains)  
**CI/CD**: GitHub Actions  
**Repo**: https://github.com/seoulbeautycom-web/carecraftz

**Admin Portal**: Completely separate deployment at admin.carecraftz.com
