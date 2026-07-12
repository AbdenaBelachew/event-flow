# EventFlow - Troubleshooting Guide

## System Won't Start

### Backend Won't Start

**Error: "Port 4000 already in use"**
```bash
# Solution: Kill process using port 4000
# Windows PowerShell:
$process = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
if ($process) { Stop-Process -Id $process.OwningProcess -Force }

# Or: Stop the running backend and restart
npm run dev
```

**Error: "Cannot connect to database"**
- Verify PostgreSQL is running
- Check database name is `events_db`
- Verify credentials in `backend/.env`
- Test connection: `psql -U postgres -h localhost events_db`

**Error: "EADDRINUSE: address already in use :::4000"**
- Find and kill the process:
  ```bash
  netstat -ano | findstr :4000
  taskkill /PID <PID> /F
  ```
- Then restart: `npm run dev`

### Frontend Won't Start

**Error: "Port 8080 in use"**
- Vite tries ports 8080, 8081, 8082 automatically
- Check what port it's using in console output
- Access app on the port shown (e.g., http://localhost:8082)

**Error: "Cannot find module @tanstack"**
- Run: `npm install` in project root
- Wait for all dependencies to install
- Then retry: `npm run dev`

**Error: "VITE error: root value has unsafe getter"**
- Clear node_modules: `rmdir /s node_modules`
- Clear package cache: `npm cache clean --force`
- Reinstall: `npm install`

## Connection Issues

### Frontend Can't Connect to Backend

**Error: "Failed to fetch from http://localhost:4000/api/events"**

1. **Check backend is running:**
   - Open http://localhost:4000 in browser
   - Should see public UI
   - Check backend terminal shows "listening on port 4000"

2. **Check network request:**
   - Open DevTools (F12)
   - Go to Network tab
   - Try any action (login, create event)
   - Look for requests to `localhost:4000/api/*`
   - Check response status (should be 2xx or 3xx)
   - Check for CORS errors

3. **Common solutions:**
   ```bash
   # Restart backend:
   cd backend
   npm run dev
   
   # Check API is responding:
   curl http://localhost:4000/api/events
   ```

**Error: "CORS policy: no 'Access-Control-Allow-Origin' header"**
- Backend CORS headers not set
- Solution: Restart backend with latest code
- Check `backend/server.js` has CORS middleware
- Verify: `backend/src/middleware/` has necessary middleware

### Can't Access Frontend

**Error: "Connection refused" on http://localhost:8082**

1. **Verify frontend is running:**
   ```bash
   # Check process:
   netstat -ano | findstr :8082
   
   # If not found, start it:
   npm run dev
   ```

2. **Verify localhost resolution:**
   ```bash
   ping localhost
   ping 127.0.0.1
   ```

3. **Try different address:**
   - http://127.0.0.1:8082 (instead of localhost)
   - http://192.168.1.4:8082 (from another machine on network)

## Authentication Issues

### Can't Register Account

**Error: "Email already in use" (409)**
- Email is already registered
- Use different email address
- Or check if account already exists

**Error: "Slug already in use" (409)**
- Company slug must be unique
- Try: `company-name-001` or `company-123`
- Check existing companies: `SELECT slug FROM companies;`

**Error: "Password must be at least 8 characters" (400)**
- Use password with 8+ characters
- Include numbers, letters, special chars for security

**Error: "Missing required fields" (400)**
- Fill in all form fields
- Check for spaces at beginning/end of input
- Verify email format is valid

### Can't Login

**Error: "Invalid credentials" (401)**
- Double-check email spelling
- Verify caps lock is off
- Ensure password is exactly correct
- Verify account was successfully registered

**Error: "User not found" (404)**
- Check auth token in LocalStorage
- Try logging in again
- Check browser console for errors

**Error: "GET /api/auth/me returns 500"**
- Token might be invalid/expired
- Clear LocalStorage and log in again
- Check backend logs for detailed error

## Event Creation Issues

### Can't Create Event

**Error: "401 Unauthorized"**
- Not logged in or token expired
- Login again to refresh token
- Check LocalStorage has authToken

**Error: "Validation error: event_start must be after sales_start"**
- Event date must be after sales start date
- Event end must be after event start
- Sales end must be before event end

**Error: "Invalid date format"**
- Use format: `YYYY-MM-DDTHH:mm:ss`
- Example: `2024-12-15T18:00:00`
- Verify timezone is correct

### Can't Upload Event Image

**Error: "File too large"**
- Image must be less than 5MB
- Resize image or compress it
- Supported formats: JPG, PNG, GIF, WebP

**Error: "Unsupported file type"**
- Only images supported
- Check file extension
- Try uploading PNG or JPG

**Error: "Drag and drop not working"**
- Try clicking upload area instead
- Check file exists and is readable
- Verify browser supports FileAPI

### Event Not Appearing

**Issue: Event created but doesn't appear in Browse**
- Event must have status "published"
- Check dashboard - event should be listed there
- Go to event detail page
- Click "Publish Event" button
- Then event appears in Browse

**Issue: Can't edit published event**
- Restart backend to ensure latest code
- Verify you have admin role
- Check database: `SELECT * FROM events WHERE id = 'xxx';`

## Ticket Management Issues

### Can't Create Ticket Type

**Error: "400 Bad Request"**
- Fill in all required fields
- Verify numbers are valid (positive)
- Check price format (use dot not comma: 250.00)

**Error: "Validation error: quantity_total must be positive"**
- Enter quantity greater than 0
- Cannot have 0 or negative quantities

**Error: "Invalid date range"**
- sales_start must be before sales_end
- sales_end must be before event end
- Verify dates are in future

### Ticket Types Not Visible

**Issue: Created ticket types but don't show in checkout**
- Event must be published
- Ticket types must have quantities available
- Check database if it saved properly
- Try refreshing page

**Issue: Can't purchase tickets**
- Event must be "published" status
- Current date must be within sales window
- Ticket type must have remaining quantity
- Price must be set correctly

## Order & Payment Issues

### Can't Create Order

**Error: "No available tickets"**
- Check ticket types exist
- Verify quantities are > 0
- Check sales dates (must be within window)
- Verify event is published

**Error: "Validation error: quantity exceeds available"**
- Requesting more than available
- Check quantity_total in ticket type
- Check quantity_sold doesn't exceed total

**Error: "Invalid buyer information"**
- Fill in all fields: name, email, phone
- Email must be valid format
- Phone must be valid number

### Payment Gateway Issues

**Error: "Payment gateway not available"**
- Check gateway selection
- Only Chapa, Telebirr, CBE Birr supported
- Ensure gateway is configured in backend
- Check `backend/.env` has gateway credentials

**Error: "Redirect to payment URL failed"**
- Gateway might be down
- Check network request in DevTools
- Try different payment gateway
- Check backend logs for error

**Error: "Payment callback not received"**
- Payment might have processed
- Check `/payment-callback` page
- Enter transaction ID to verify status
- Check backend payment logs

## QR Scanner Issues

### Scanner Not Working

**Error: "Camera permission denied"**
- Allow camera access in browser settings
- On HTTPS only (localhost works)
- Try different browser
- Check camera device is available

**Error: "QR code not recognized"**
- Position code clearly in frame
- Ensure adequate lighting
- Try manual code entry instead
- Check code format is valid

**Error: "Ticket not found (invalid code)"**
- Verify ticket code is correct
- Check ticket hasn't already been used
- Ensure ticket is for current event
- Try scanning different ticket

**Error: "Ticket status unpaid"**
- Order payment must be completed first
- Verify order payment status
- Payment might still be processing
- Check payment gateway status

## Database Issues

### Database Connection Fails

**Error: "connect ECONNREFUSED 127.0.0.1:5432"**
- PostgreSQL not running
- Start PostgreSQL service
- Verify port 5432 is correct
- Check connection string in `backend/.env`

**Error: "database events_db does not exist"**
- Create database:
  ```bash
  createdb -U postgres events_db
  ```
- Or using psql:
  ```sql
  CREATE DATABASE events_db;
  ```

**Error: "role postgres does not exist"**
- Check PostgreSQL username (might be different)
- Create user if needed:
  ```sql
  CREATE USER postgres WITH PASSWORD 'password';
  GRANT ALL PRIVILEGES ON DATABASE events_db TO postgres;
  ```

### Data Not Persisting

**Issue: Data disappears after restart**
- Verify database connection is active
- Check data exists in tables:
  ```bash
  psql -U postgres -d events_db -c "SELECT * FROM events;"
  ```
- If empty, migrations might not have run
- Run migrations:
  ```bash
  node backend/src/db/migrate.js
  ```

**Issue: Only partial data showing**
- Check if tables exist:
  ```bash
  psql -U postgres -d events_db -c "\dt"
  ```
- Check for errors in insert operations
- Verify data types match schema
- Check database constraints

## Performance Issues

### Slow Page Load

**Issue: Frontend takes long to load**
- Check network tab in DevTools
- Look for slow API requests
- Check backend response times
- Restart backend if needed

**Solution:**
```bash
# Restart frontend with clean cache
npm run dev

# Clear browser cache
# Ctrl+Shift+Delete (Chrome/Edge)
# Or in DevTools: Application > Clear All
```

### Slow API Responses

**Issue: /api/events takes 5+ seconds**
- Database query might be slow
- Check PostgreSQL logs
- Create database indexes if missing
- Monitor database CPU/memory

**Solution:**
```bash
# Restart backend
cd backend
npm run dev

# Check database status
psql -U postgres -d events_db -c "\l"
```

## Getting More Help

### Check Logs

**Backend Logs:**
- Look at terminal where `npm run dev` runs
- Check for error messages
- Look for stack traces

**Frontend Logs:**
- Open DevTools (F12)
- Go to Console tab
- Look for red error messages
- Check Network tab for failed requests

**Database Logs:**
- Check PostgreSQL log files
- Location varies by OS
- Windows: Check PostgreSQL data directory

### Debugging Steps

1. **Check all processes running:**
   ```bash
   netstat -ano | findstr "4000\|8082"
   ```

2. **Test individual components:**
   - Database: `psql -U postgres -d events_db`
   - Backend API: `curl http://localhost:4000/api/events`
   - Frontend: `http://localhost:8082` in browser

3. **Clear and restart everything:**
   ```bash
   # Stop all processes (Ctrl+C in each terminal)
   # Clear caches:
   cd backend && npm cache clean --force
   cd .. && npm cache clean --force
   # Restart:
   npm run dev  # frontend
   npm run dev  # backend (in backend folder)
   ```

4. **Reset database (last resort):**
   ```bash
   dropdb -U postgres events_db
   createdb -U postgres events_db
   node backend/src/db/migrate.js
   ```

## Still Having Issues?

1. **Check documentation:**
   - `STARTUP_GUIDE.md`
   - `VERIFICATION_CHECKLIST.md`
   - `NAVIGATION_GUIDE.md`

2. **Review code:**
   - Backend routes: `backend/src/modules/*/`
   - Frontend components: `src/routes/`
   - API client: `src/lib/api.ts`

3. **Common issues table:**

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| "Cannot connect to localhost:4000" | Backend not running | `npm run dev` in backend folder |
| "Port already in use" | Process still running | Kill process and restart |
| "Login fails" | Invalid credentials | Create new account |
| "No events showing" | Event not published | Publish event first |
| "Can't create event" | Not logged in | Login and try again |
| "Blank frontend page" | API unreachable | Check backend is running |
| "Can't upload image" | File too large | Compress image < 5MB |
| "Scanner not working" | Camera permission | Allow camera access |

---

**Need more help?** Check the other documentation files or review the relevant source code in the project.
