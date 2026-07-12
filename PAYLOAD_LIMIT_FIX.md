# Fix: 413 Payload Too Large Error

**Issue:** Creating events with large cover images fails with 413 error

**Cause:** Express.js default JSON payload limit is 100KB

**Solution:** Increased to 50MB to support large image data URLs

## Changes Made

**File:** `backend/app.js`

**Before:**
```javascript
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));
```

**After:**
```javascript
app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
```

## To Apply Fix

1. **Restart Backend:**
   ```bash
   # Stop the current process (Ctrl+C)
   cd backend
   npm start
   ```

2. **Try Creating Event Again:**
   - Upload or paste large image URL
   - Should now work without 413 error

## What This Fixes

✅ Creating events with large cover images  
✅ Base64-encoded image data  
✅ Large file uploads  
✅ Multi-image scenarios

## Limits Increased

- JSON payload: 100KB → 50MB
- URL-encoded payload: 100KB → 50MB

**Status:** Ready to restart backend with this fix applied
