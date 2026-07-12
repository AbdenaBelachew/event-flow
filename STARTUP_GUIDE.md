# EventFlow - Startup & Running Guide

## System Status ✅

The EventFlow platform is **fully operational** and ready to use. Here's what's running:

### Servers Running:
- **Backend API**: http://localhost:4000
- **Frontend App**: http://localhost:8082
- **Database**: PostgreSQL on localhost:5432 (`events_db`)

## Quick Start

### 1. Access the Application
Open your browser and go to: **http://localhost:8082**

### 2. First Steps

#### Option A: Create a New Account (Company)
1. Click **"Get Started"** button on homepage
2. Fill in the registration form:
   - Company Name (e.g., "My Event Company")
   - Slug (unique identifier, e.g., "my-events")
   - Contact Email
   - Admin Name (your name)
   - Admin Email (your email)
   - Password (min 8 characters)
3. Click **Register**
4. You'll be logged in automatically and redirected to Dashboard

#### Option B: Use Existing Account
1. Click **"Sign In"** on homepage
2. Enter credentials
3. Click **Login**

## Dashboard & Navigation

After login, you're on the **Dashboard** with quick access to:

### Main Navigation (Top Bar)
- **Browse Events** - View all public events
- **Create Event** - Start a new event
- **Logout** - Exit the system

### Create Your First Event
1. Click **"Create Event"** in dashboard or top nav
2. Fill in event details:
   - Title
   - Description
   - Venue (location name)
   - City
   - Event dates (start & end)
   - Sales period (when tickets go on sale)
   - Cover image (upload from computer or paste URL)
3. Click **Create Event**

### Event Management
Once an event is created, you can:

1. **Edit Event** - Click event name → **Edit** button → Modify details
2. **Manage Tickets** - On Edit page → **Ticket Types** tab
   - Create ticket tiers (VIP, Regular, etc.)
   - Set prices, quantities, sale dates
3. **Publish Event** - Click **Publish** to make it public
4. **View Analytics** - Click event → **Analytics** to see:
   - Total capacity
   - Tickets sold
   - Revenue
   - Check-in statistics
5. **QR Scanner** - Check in attendees:
   - Click event → **Scanner**
   - Scan QR codes or enter codes manually
   - View check-in history

## Features Overview

### For Event Organizers
- ✅ Create and manage events
- ✅ Define ticket types with pricing
- ✅ Upload event cover images
- ✅ Publish events to public listings
- ✅ View real-time analytics
- ✅ Check in attendees via QR scan
- ✅ Export attendance data

### For Customers
- ✅ Browse published events
- ✅ Search by name or city
- ✅ Purchase tickets
- ✅ View order status
- ✅ Track tickets with QR codes

### Payment Processing
Integrated with:
- **Chapa** - Primary payment gateway
- **Telebirr** - Alternative payment method
- **CBE Birr** - Bank transfer integration

## Database

The PostgreSQL database includes 8 tables:
- `companies` - Event organizer companies
- `users` - System users (admins, staff)
- `events` - Event records
- `ticket_types` - Ticket tiers for events
- `orders` - Customer ticket purchases
- `tickets` - Individual tickets
- `payments` - Payment transaction records
- `check_ins` - QR code scan logs

## Troubleshooting

### Frontend Not Loading?
- Check that frontend is running on **http://localhost:8082**
- Check browser console (F12) for errors
- Ensure backend is accessible at **http://localhost:4000**

### Backend Not Responding?
- Verify backend process is running: `npm run dev` in `backend/` folder
- Check database connection: PostgreSQL should be running
- View backend logs for errors

### Login Not Working?
- Ensure you've registered first
- Check backend logs for auth errors
- Verify email and password are correct

### Can't Create Events?
- Make sure you're logged in
- Check that you have company_admin role (automatic with registration)
- Backend should return event data in response

## File Locations

### Frontend Code
- Routes: `src/routes/` (all pages)
- API Client: `src/lib/api.ts`
- Auth Context: `src/lib/auth-context.tsx`
- Components: `src/components/ui/` (UI components)

### Backend Code
- API Routes: `backend/src/modules/` (organized by feature)
- Database: `backend/src/db/` (migrations & schema)
- Auth: `backend/src/modules/auth/`
- Middleware: `backend/src/middleware/`

### Configuration
- Frontend Config: `.env` (if using environment variables)
- Backend Config: `backend/.env`
- Database Config: `backend/src/config/db.js`

## Restart Services

### Restart Frontend
```bash
# In workspace root or frontend terminal
npm run dev
```
Runs on: http://localhost:8082

### Restart Backend
```bash
# In backend folder
npm run dev
```
Runs on: http://localhost:4000

### Reset Database
```bash
# Requires psql or pgAdmin
dropdb events_db
createdb -U postgres events_db

# Then run migrations
node backend/src/db/migrate.js
```

## API Endpoints Summary

### Authentication
- `POST /api/auth/register-company` - Create new company account
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Events
- `GET /api/events` - List all events
- `POST /api/events` - Create event (requires auth)
- `GET /api/events/:id` - Get event details
- `PATCH /api/events/:id` - Update event
- `POST /api/events/:id/publish` - Publish event
- `GET /api/events/:id/availability` - Check ticket availability
- `GET /api/events/:id/stats` - Get event statistics

### Tickets & Orders
- `POST /api/orders` - Create order (purchase tickets)
- `GET /api/orders/:id` - Get order details
- `GET /api/tickets/:code/check-in` - Check in ticket
- `GET /api/events/:id/ticket-types` - List ticket types

### Payments
- `POST /api/orders/:id/pay` - Initiate payment
- `POST /api/payments/webhook/chapa` - Payment webhook
- `POST /api/payments/webhook/telebirr` - Telebirr webhook

## Next Steps

1. **Explore the Dashboard** - Get familiar with the layout
2. **Create a Test Event** - Practice the full workflow
3. **Add Ticket Types** - Set up pricing tiers
4. **Publish the Event** - Make it visible to public
5. **Test the Checkout** - Purchase tickets as a customer
6. **Scan QR Codes** - Use the scanner feature

## Support Files

For more detailed information:
- `NAVIGATION_GUIDE.md` - Complete menu and feature navigation
- `ROLES_AND_MENUS.md` - Role-based access control details
- `PROJECT_SUMMARY.md` - Technical architecture overview
- `TESTING_GUIDE.md` - Comprehensive testing scenarios
- `SETUP.md` - Initial project setup instructions

---

**Your EventFlow system is ready to go! 🎉**
