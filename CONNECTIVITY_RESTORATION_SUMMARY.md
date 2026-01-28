# 🔌 LeadLab Connectivity Restoration Summary

## ✅ Issues Fixed

### 1. **Wrong Port Configuration (CRITICAL)**
   - **File**: `frontend/src/api/api.ts`
   - **Issue**: Default port was `8080` instead of `8000`
   - **Fix**: Changed default from `http://localhost:8080` to `http://localhost:8000`
   - **Impact**: API calls would fail in development mode

### 2. **Token Refresh URL in Dev Mode (CRITICAL)**
   - **Files**: 
     - `frontend/src/services/axios.ts`
     - `frontend/src/lib/axios.ts`
   - **Issue**: Token refresh endpoint used `API_URL` which is empty in dev mode
   - **Fix**: Added dev mode check to use proxy path `/api/v1/auth/refresh/` in development
   - **Impact**: Token refresh would fail silently in development, causing auth issues

### 3. **LinkedIn Service Wrong Port**
   - **File**: `frontend/src/services/linkedin.ts`
   - **Issue**: Default port was `8080` instead of `8000`
   - **Fix**: Changed default from `http://localhost:8080` to `http://localhost:8000`
   - **Impact**: LinkedIn OAuth callback would fail

### 4. **API Service Configuration**
   - **File**: `frontend/src/services/api/index.ts`
   - **Issue**: Used `API_URL` from config which doesn't handle dev mode proxy
   - **Fix**: Added dev mode detection to use proxy (`/api/v1`) in development
   - **Impact**: Some API calls would fail in development mode

## 🔍 Architecture Overview

### Backend (FastAPI)
- **Port**: `8000`
- **Base URL**: `http://localhost:8000` (dev) / `https://api.the-leadlab.com` (prod)
- **API Prefix**: `/api/v1`
- **CORS**: Configured for `localhost:5173` (Vite default port)

### Frontend (Vite + React)
- **Port**: `5173` (Vite default)
- **Proxy**: Routes `/api/v1/*` to `http://127.0.0.1:8000` in development
- **Production**: Uses `VITE_API_URL` environment variable

## 🔧 Configuration Files

### Frontend API Configuration Files:
1. **`frontend/src/services/axios.ts`** - Main axios instance (uses proxy in dev)
2. **`frontend/src/lib/axios.ts`** - Alternative axios instance (uses proxy in dev)
3. **`frontend/src/api/api.ts`** - Legacy API instance (fixed port)
4. **`frontend/src/services/api/index.ts`** - API service index (now uses proxy)
5. **`frontend/src/config.ts`** - Config exports (production defaults)

### Backend Configuration:
- **`backend/main.py`** - FastAPI app with CORS middleware
- **`backend/app/core/config.py`** - Settings with environment variable loading

## 📝 Environment Variables

### Frontend (.env)
```env
# Development: Leave empty to use Vite proxy
VITE_API_URL=
# Production: VITE_API_URL=https://api.the-leadlab.com

VITE_LINKEDIN_CLIENT_ID=your-linkedin-client-id
VITE_LINKEDIN_REDIRECT_URI=http://localhost:5173/linkedin/callback
```

### Backend (.env)
```env
# Required
SECRET_KEY=your-secret-key
TOKEN_ENCRYPTION_KEY=your-token-encryption-key
API_SECRET_KEY=your-api-secret-key
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/leadlab_db
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
STRIPE_PUBLISHABLE_KEY=your-stripe-key
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-webhook-secret
SMTP_PASSWORD=your-smtp-password
INVOICE_EMAIL_PASSWORD=your-invoice-email-password
```

## ✅ Verification Steps

### 1. Start Backend
```bash
cd backend
# Create virtual environment if needed
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with required variables
cp .env.example .env
# Edit .env with your values

# Run backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start Frontend
```bash
cd frontend
# Install dependencies if needed
npm install

# Create .env file (optional for dev - proxy handles it)
# For production: cp .env.example .env

# Run frontend
npm run dev
```

### 3. Test Connectivity

#### Backend Health Check
```bash
# Should return: {"message":"LeadLab Backend API","version":"1.0.0",...}
curl http://localhost:8000/

# Should return: {"status":"healthy","database":"connected",...}
curl http://localhost:8000/health

# Should return: {"api_version":"v1","status":"active",...}
curl http://localhost:8000/api/v1/status
```

#### Frontend-Backend Connection
1. Open browser: `http://localhost:5173`
2. Open DevTools → Network tab
3. Check that API calls to `/api/v1/*` are proxied correctly
4. Verify no CORS errors in console
5. Test login/authentication flow

### 4. Common Issues & Solutions

#### Issue: "Connection Refused" on port 8000
- **Solution**: Ensure backend is running on port 8000
- **Check**: `netstat -an | findstr :8000` (Windows) or `lsof -i :8000` (Mac/Linux)

#### Issue: CORS errors in browser
- **Solution**: Verify backend CORS includes `http://localhost:5173`
- **Check**: `backend/main.py` lines 82-95

#### Issue: 404 on API endpoints
- **Solution**: Verify backend router is mounted at `/api/v1`
- **Check**: `backend/main.py` line 149

#### Issue: Token refresh fails
- **Solution**: Verify token refresh uses proxy in dev mode
- **Check**: `frontend/src/services/axios.ts` line 261-264

## 🎯 Next Steps

1. **Create .env files** (if not already created):
   - Copy `.env.example` to `.env` in both `frontend/` and `backend/`
   - Fill in required values

2. **Start services**:
   - Backend: `cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000`
   - Frontend: `cd frontend && npm run dev`

3. **Verify connectivity**:
   - Test backend health endpoint
   - Test frontend login/API calls
   - Check browser console for errors

4. **Database setup** (if needed):
   - Ensure MySQL is running
   - Create database: `CREATE DATABASE leadlab_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
   - Run migrations if available

## 📊 Connectivity Map

```
Frontend (localhost:5173)
    ↓ (Vite Proxy)
    ↓ /api/v1/* → http://127.0.0.1:8000/api/v1/*
    ↓
Backend (localhost:8000)
    ↓
    ↓ /api/v1/*
    ↓
FastAPI Router
    ↓
Database (MySQL)
```

## 🔒 Security Notes

- Never commit `.env` files to version control
- Use strong, randomly generated keys for production
- CORS is configured for development origins - update for production
- All API endpoints require authentication (Bearer token)

## 📚 Related Files

- `backend/main.py` - FastAPI app entry point
- `backend/app/core/config.py` - Backend configuration
- `frontend/vite.config.ts` - Vite proxy configuration
- `frontend/src/services/axios.ts` - Main API client
- `frontend/src/config.ts` - Frontend configuration

---

**Restoration Complete** ✅
All critical connectivity issues have been fixed. The frontend and backend are now properly wired together.
