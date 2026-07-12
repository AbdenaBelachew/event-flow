# EventFlow - Verification Checklist

Use this checklist to verify that all components of the EventFlow system are working correctly.

## ✅ Pre-Flight Checks

- [ ] PostgreSQL is running on `localhost:5432`
- [ ] Database `events_db` exists
- [ ] Backend process is running (shows "listening on http://localhost:4000")
- [ ] Frontend process is running (shows "ready in" on port 8082 or similar)
- [ ] No error messages in console output

## ✅ Server Access Checks

Test these URLs in your browser:

- [ ] Backend Homepage: http://localhost:4000
  - Should show public HTML UI
  
- [ ] Backend API Health: http://localhost:4000/api/events
  - Should return JSON array (even if empty)
  - Status: 200 or 304
  
- [ ] Frontend App: http://localhost:8082
  - Should show EventFlow homepage
  - Shows "Manage Events Like Never Before" heading
  - Navigation shows "Sign In" and "Get Started" buttons

## ✅ Authentication Flow

### Register New Account
- [ ] Click "Get Started" on homepage
- [ ] Fill registration form with:
  - Company Name: `Test Company`
  - Slug: `test-company-001`
  - Contact Email: `company@test.com`
  - Admin Name: `John Doe`
  - Admin Email: `john@test.com`
  - Password: `Password123`
- [ ] Click "Register"
- [ ] Should see success message
- [ ] Should be redirected to Dashboard
- [ ] Should show logged-in user name

### Login
- [ ] Logout from Dashboard
- [ ] Click "Sign In" on homepage
- [ ] Enter email: `john@test.com`
- [ ] Enter password: `Password123`
- [ ] Click "Login"
- [ ] Should be redirected to Dashboard
- [ ] Should show user name

### Check Auth Token
- [ ] Open browser DevTools (F12)
- [ ] Go to Application > Local Storage
- [ ] Look for `authToken` key
- [ ] Should contain a valid JWT token
- [ ] Token should be present after login
- [ ] Token should be cleared after logout

## ✅ Event Management

### Create Event
- [ ] From Dashboard, click "Create Event"
- [ ] Fill in event details:
  - Title: `Test Music Festival`
  - Description: `A great music event`
  - Venue: `Downtown Arena`
  - City: `Addis Ababa`
  - Event Start: `2024-12-15 18:00`
  - Event End: `2024-12-15 22:00`
  - Sales Start: `2024-12-01 10:00`
  - Sales End: `2024-12-15 17:00`
- [ ] Upload image (click on image upload area)
- [ ] Click "Create Event"
- [ ] Should show success message
- [ ] Should be redirected to event detail page

### Verify Event Created
- [ ] From Dashboard, click "Browse Events"
- [ ] Your new event should NOT appear (it's in draft status)
- [ ] Back to Dashboard
- [ ] Should see your event listed
- [ ] Click on event name
- [ ] Should see event details page

### Edit Event
- [ ] On event detail page, click "Edit" button
- [ ] Modify title to: `Updated Festival`
- [ ] Click "Save Changes"
- [ ] Should show success message
- [ ] Verify title changed in detail view

### Publish Event
- [ ] On event detail page, click "Publish Event"
- [ ] Should show confirmation
- [ ] Status should change to "published"
- [ ] Now go to "Browse Events"
- [ ] Your event should appear in public listing

## ✅ Ticket Management

### Create Ticket Types
- [ ] On event detail page, click "Edit"
- [ ] Go to "Ticket Types" tab
- [ ] Click "Add Ticket Type"
- [ ] Fill in:
  - Name: `VIP Ticket`
  - Price: `500.00` (ETB)
  - Quantity: `50`
  - Max per Order: `5`
- [ ] Click "Add"
- [ ] Add another type:
  - Name: `General Ticket`
  - Price: `250.00`
  - Quantity: `200`
- [ ] Should see both ticket types listed
- [ ] Click "Save Changes"

## ✅ Order & Payment Flow

### Browse and Purchase Tickets
- [ ] Go to "Browse Events"
- [ ] Click on your published event
- [ ] Should see ticket types available
- [ ] Select ticket type: `General Ticket`
- [ ] Enter quantity: `2`
- [ ] Click "Add to Cart"
- [ ] Fill in buyer info:
  - Name: `Jane Buyer`
  - Email: `jane@test.com`
  - Phone: `+251911223344`
- [ ] Review total: `2 × 250 = 500 ETB`
- [ ] Click "Proceed to Checkout"

### Verify Order Created
- [ ] Should see order confirmation page
- [ ] Should show order ID (UUID)
- [ ] Should show ticket details
- [ ] Should see payment gateway options

## ✅ Analytics

### View Event Statistics
- [ ] Go to Dashboard
- [ ] Click on event name
- [ ] Click "Analytics" button
- [ ] Should see stats dashboard with:
  - Total Capacity
  - Tickets Sold
  - Total Revenue
  - Check-in Count
  - Charts/graphs

## ✅ QR Scanner

### Test QR Check-in
- [ ] On event detail page, click "Scanner"
- [ ] Should see scanner interface
- [ ] Create a test QR code (can use online tool)
- [ ] Or manually enter a ticket code
- [ ] Should show check-in result (success/error)
- [ ] Successful check-in should update stats

## ✅ Navigation Menu

### Top Navigation Bar
- [ ] Should have "Browse Events" link
- [ ] Should have "Create Event" link
- [ ] Should have user name displayed
- [ ] Should have "Logout" option

### Dashboard Layout
- [ ] Left sidebar with quick actions
- [ ] Main content area with event list
- [ ] Event cards showing:
  - Event name
  - Date
  - Status
  - Action buttons

## ✅ API Endpoints Verification

Use a tool like Postman or curl to test these endpoints:

### Auth Endpoints
```bash
# Register
POST http://localhost:4000/api/auth/register-company
Body: {
  "company_name": "Test Co",
  "slug": "test-co",
  "contact_email": "test@co.com",
  "admin_name": "Admin",
  "admin_email": "admin@co.com",
  "password": "Pass123!"
}
Status: 201, Returns token and user

# Login
POST http://localhost:4000/api/auth/login
Body: {"email": "admin@co.com", "password": "Pass123!"}
Status: 200, Returns token and user

# Get Current User
GET http://localhost:4000/api/auth/me
Header: Authorization: Bearer {TOKEN}
Status: 200, Returns user object
```

### Events Endpoints
```bash
# List all events
GET http://localhost:4000/api/events
Status: 200, Returns array of events

# Get event details
GET http://localhost:4000/api/events/{EVENT_ID}
Status: 200, Returns event object

# Get event availability
GET http://localhost:4000/api/events/{EVENT_ID}/availability
Status: 200, Returns ticket types and availability

# Get event statistics
GET http://localhost:4000/api/events/{EVENT_ID}/stats
Status: 200, Returns analytics data
```

## ✅ Database Verification

Open psql or pgAdmin and verify tables exist:

```sql
\dt  -- List all tables
-- Should see:
-- companies
-- users
-- events
-- ticket_types
-- orders
-- tickets
-- payments
-- check_ins

-- Check row counts:
SELECT count(*) FROM companies;
SELECT count(*) FROM users;
SELECT count(*) FROM events;
SELECT count(*) FROM orders;
SELECT count(*) FROM tickets;
```

## ✅ Common Issues & Resolution

### Issue: "Cannot connect to localhost:4000"
- [ ] Verify backend is running: `npm run dev` in backend folder
- [ ] Check if PostgreSQL is running
- [ ] Look for error messages in backend console

### Issue: "Frontend shows blank page"
- [ ] Check browser console (F12) for errors
- [ ] Verify API connection works (test /api/events)
- [ ] Clear browser cache and reload
- [ ] Check that frontend is on correct port (8082)

### Issue: "Login fails with 500 error"
- [ ] Check backend logs for error details
- [ ] Verify database connection
- [ ] Try creating new account instead
- [ ] Check that PostgreSQL is accessible

### Issue: "Cannot create events"
- [ ] Verify you're logged in
- [ ] Check user role is "company_admin"
- [ ] Check backend logs for error
- [ ] Verify all required fields are filled

### Issue: "Cannot see events in Browse"
- [ ] Event must be "published" status
- [ ] Check event dates are valid
- [ ] Verify event has ticket types
- [ ] Check database directly: `SELECT * FROM events WHERE status = 'published';`

## ✅ Final Sign-Off

All checklist items complete? Great! Your EventFlow system is:
- ✅ Fully operational
- ✅ Database connected
- ✅ APIs responding
- ✅ Frontend rendering
- ✅ Authentication working
- ✅ Event management functional
- ✅ Ready for production use

**System Status: READY FOR TESTING** 🎉

---

For detailed documentation, see:
- `STARTUP_GUIDE.md` - How to start using the system
- `NAVIGATION_GUIDE.md` - Feature navigation
- `ROLES_AND_MENUS.md` - Role-based access
- `TESTING_GUIDE.md` - Comprehensive testing scenarios
