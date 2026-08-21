# PCMS Deployment Guide: Local vs Hostinger

## Issue Summary
The application failed on Hostinger because URLs were hardcoded to `localhost`. The backend and frontend need environment-specific configuration.

## Local Development (Working)
The setup works on localhost because:
- Frontend runs on `http://127.0.0.1:5173`
- Backend API runs on `http://127.0.0.1:8000`
- Python services run on `localhost:5000` (anomaly) and `localhost:5002` (OCR)

## Changes Made

### 1. Frontend Configuration (Fixed)
**File:** `frontend/.env`
- ✅ Removed hardcoded `VITE_OCR_SERVICE_URL`
- ✅ Now uses backend proxy at `/api/ocr/scan` (works on any domain)
- ✅ VITE_API_BASE_URL defaults to `/api` (relative path)

### 2. Backend API Proxy (Already Working)
**File:** `backend/routes/api.php` → `OcrController`
- ✅ Backend has `/api/ocr/scan` endpoint that proxies to Python OCR service
- ✅ Uses `config('services.ocr.url')` from backend/.env

### 3. CORS Configuration (Fixed)
**File:** `backend/config/cors.php` (NEW)
- ✅ Allows requests from localhost dev servers
- ✅ Allows requests from Hostinger domains (*.hostinger.com, *.hostingersite.com)
- ✅ Uses environment variable for production domain

## Deployment to Hostinger

### Step 1: Update Backend .env on Hosting
Edit `backend/.env` on Hostinger with your actual domain:

```php
# For Hostinger, update these:
ANOMALY_SERVICE_URL=https://yourdomain.com/anomaly
OCR_SERVICE_URL=https://yourdomain.com/ocr
# OR if services are on same server:
ANOMALY_SERVICE_URL=http://localhost:5000
OCR_SERVICE_URL=http://localhost:5002
```

### Step 2: Update CORS Config (Optional)
The `backend/config/cors.php` already includes patterns for Hostinger domains. If you need more specific URLs:

```php
'allowed_origins' => [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    env('APP_URL'),  // Uses .env APP_URL
],
```

### Step 3: Frontend Build
Ensure frontend is built before uploading:

```bash
cd frontend
npm run build
# This creates dist/ folder with production-ready files
```

### Step 4: Upload to Hostinger
Upload these folders to Hostinger:
- `frontend/dist/` → public root (or subdirectory)
- `backend/` → private folder or subdirectory

## Testing After Deployment

### 1. Check CORS Headers
Open browser DevTools → Network tab:
- Click on API request
- Look for `Access-Control-Allow-Origin` header
- Should show your Hostinger domain or `*`

### 2. Test API Calls
Console should show:
- ✅ Dashboard loads: `GET /api/dashboard` → 200
- ✅ OCR endpoint works: `POST /api/ocr/scan` → 200 or error from OCR service

### 3. Check Error Messages
If still failing:
- Backend .env might have wrong service URLs
- Python services might not be running on hosting
- CORS might be blocking the request

## Python Services on Hostinger

**Important:** Check if Hostinger supports Python services:
1. If Python services are NOT available on hosting:
   - Deploy a simplified version that skips anomaly/OCR
   - Or use external API services (cloud ML providers)

2. If Python services ARE available:
   - Update ANOMALY_SERVICE_URL and OCR_SERVICE_URL to match Hostinger service URLs
   - Set `GOOGLE_APPLICATION_CREDENTIALS` to the absolute path of a Google Cloud service account JSON key file on the server.
   - Enable the Cloud Vision API in your Google Cloud project.
   - Keep the credentials file private and never commit it to the repository.
   - Test services directly: `curl https://yourdomain.com/ocr/scan`

## Common Issues & Fixes

### "Failed to fetch" Error
**Cause:** Frontend can't reach backend
**Fix:** 
- Check CORS config allows your domain
- Verify backend/.env APP_URL matches your domain
- Check firewall/security settings on Hostinger

### OCR/Anomaly Returns 404
**Cause:** Backend service URL is wrong
**Fix:**
- Update ANOMALY_SERVICE_URL and OCR_SERVICE_URL in backend/.env
- Verify services are running on hosting
- Check service URLs are accessible from backend

### Frontend Assets Not Loading
**Cause:** Frontend not built or wrong path
**Fix:**
- Run `npm run build` in frontend folder
- Upload `frontend/dist/` contents to correct public folder
- Check Hostinger's public root settings

## File Summary

| File | Purpose | Status |
|------|---------|--------|
| `frontend/.env` | Frontend config | ✅ Fixed - uses /api proxy |
| `backend/.env` | Backend config (needs update for hosting) | ⚠️ Update on hosting |
| `backend/config/cors.php` | CORS whitelist | ✅ Fixed - allows Hostinger domains |
| `backend/routes/api.php` | API endpoints | ✅ Has /api/ocr/scan proxy |
| `backend/app/Http/Controllers/OcrController.php` | OCR proxy logic | ✅ Working |

## Next Steps

1. **Local Testing:** Verify everything works on localhost with current setup
2. **Prepare Hostinger:** Get your Hostinger domain name
3. **Update .env:** Update backend/.env with correct domain/service URLs
4. **Build Frontend:** Run `npm run build`
5. **Deploy:** Upload to Hostinger file manager
6. **Test:** Access the hosted URL and check browser console for errors

For more details, check the browser console → Network tab for actual error responses.
