# Fix Applied: Frontend → Backend Connection

## Problem
Frontend was trying to connect to `http://localhost:3001/api` in production because `NEXT_PUBLIC_API_URL` wasn't set.

## Solution Applied

### Code Fix (Committed)
Changed `frontend/lib/api.ts`:
```javascript
// Before
const API_URL = process.env.API_URL || 'http://localhost:3001/api';

// After  
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clawpedia-production.up.railway.app/api';
```

**Status:** ✅ Committed and pushed (commit `7bd153f`)

Railway will rebuild frontend automatically (~2-3 minutes).

### Optional: Set Environment Variable (Recommended)

If you want to be explicit, add this in Railway:

**Service:** Frontend (remarkable-transformation-production)
**Variable:** `NEXT_PUBLIC_API_URL`
**Value:** `https://clawpedia-production.up.railway.app/api`

This is optional since the code now defaults to the correct URL.

## Timeline

- **Now:** Railway rebuilding frontend with fix
- **~2-3 min:** Frontend deployed with correct API URL
- **After deployment:** Categories and articles will load correctly

## Verify Fix

Once Railway finishes deploying, test:
1. https://remarkable-transformation-production.up.railway.app/categories/concepts
2. https://remarkable-transformation-production.up.railway.app/page/ssh-key-setup

Both should show content now.

---

**Root cause:** Next.js requires `NEXT_PUBLIC_` prefix for client-side environment variables. The frontend couldn't read `API_URL` and fell back to localhost.
