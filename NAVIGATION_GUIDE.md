# EventFlow - Navigation Guide

## 🗺️ Main Menu Navigation

### From Dashboard
The dashboard has a top navigation bar with quick access to:

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo] EventFlow  │  🌍 Browse Events  │  ➕ Create Event  │  [Logout]  │
└─────────────────────────────────────────────────────────────────┘
```

- **Logo** - Click to go back to homepage
- **🌍 Browse Events** - View all published events
- **➕ Create Event** - Create a new event
- **Your Name** - Shows logged-in user
- **Logout** - Sign out

---

## 📋 Event Management Flow

### 1. **Create Event** (Dashboard → ➕ Create Event)
   - Fill in event details
   - Upload or paste cover image
   - Set dates and sales period
   - Creates event in **"Draft"** status

### 2. **Edit Event Details** (Event Detail Page → Admin Actions → ✎ Edit Event Details)
   - Switch to **"Event Details"** tab
   - Update any event information
   - Save changes
   - Also includes **Ticket Types** tab for managing tickets

### 3. **Add Ticket Types** (Edit Event Page → Ticket Types Tab)
   - Name: "General Admission", "VIP", etc.
   - Price in ETB
   - Quantity available
   - Click "Add Ticket Type"

### 4. **Publish Event** (Edit Event Page → 🚀 Publish Event)
   - Makes event visible to buyers
   - Opens ticket sales
   - Changes status to **"Published"**

---

## 🎫 Event Menu (When Viewing an Event)

Click on any event from the dashboard to see the **Event Detail Page**.

### Admin Actions (Right Sidebar)
When you own the event, you'll see:

```
┌─────────────────────────────┐
│    Admin Actions            │
├─────────────────────────────┤
│ ✎ Edit Event Details        │
│ 📊 View Analytics           │
│ 📱 Check-in Scanner         │
│ 🚀 Publish Event (if draft) │
└─────────────────────────────┘
```

#### ✎ **Edit Event Details**
   - Access to edit event info
   - Manage ticket types
   - Preview before saving

#### 📊 **View Analytics**
   - Event statistics
   - Capacity and occupancy
   - Revenue tracking
   - Ticket sales breakdown
   - Check-in rates

#### 📱 **Check-in Scanner**
   - Scan QR codes at event
   - Manual ticket code entry
   - Real-time check-in validation
   - Check-in history

#### 🚀 **Publish Event**
   - Only shows if event is in "Draft" status
   - Requires at least one active ticket type
   - Makes event available for purchase

---

## 👥 Customer Flow (Buying Tickets)

### 1. **Browse Events** (Any page → 🌍 Browse Events)
   - See all published events
   - Search by name
   - Filter by city
   - View ticket availability

### 2. **View Event** (Browse → Click Event)
   - See full event details
   - Check ticket types and prices
   - View ticket availability

### 3. **Get Tickets** (Event Detail → Buy Tickets → Purchase Tickets)
   - Select ticket quantities
   - Choose ticket tiers
   - Review total price

### 4. **Checkout** (Event Detail → Purchase Tickets)
   - Fill buyer information (name, email, phone)
   - Review order summary
   - Click "Continue to Payment"

### 5. **Payment** (Order Page → Choose Payment Gateway)
   - Select payment method (Chapa, Telebirr, CBE Birr)
   - Click to initiate payment
   - Complete payment with gateway

### 6. **Confirmation** (Payment Callback)
   - View payment status
   - Receive confirmation
   - Tickets ready to use

---

## 📍 Complete Navigation Map

```
Homepage (/)
├── 🔐 Login (/login)
├── 📝 Register (/register)
├── 🌍 Browse Events (/browse)
│   └── [Click Event] → Event Detail
└── [After Login] Dashboard (/dashboard)
    ├── [Click Event] → Event Detail (/events/:id)
    │   ├── ✎ Edit Event Details (/events/:id/edit)
    │   │   ├── "Event Details" tab - Edit info
    │   │   └── "Ticket Types" tab - Manage tickets
    │   ├── 📊 View Analytics (/events/:id/stats)
    │   ├── 📱 Check-in Scanner (/events/:id/scanner)
    │   └── 💳 Checkout (/events/:id/checkout)
    ├── ➕ Create Event (/events/create)
    └── 🚀 [After Checkout] Order Tracking (/orders/:id)
        └── 💳 Select Payment Gateway & Pay

Payment Flows:
    ├── Payment Processing (Chapa/Telebirr/CBE Birr)
    └── Payment Callback (/payment-callback)
```

---

## 🔑 Quick Tips

### Finding Admin Menus
1. **Edit Event** - Go to event detail → Admin Actions → ✎ Edit Event Details
2. **Manage Tickets** - Edit Event → Switch to "Ticket Types" tab
3. **Check-in** - Go to event detail → Admin Actions → 📱 Check-in Scanner
4. **Statistics** - Go to event detail → Admin Actions → 📊 View Analytics

### Creating an Event (Step by Step)
1. Dashboard → ➕ Create Event
2. Fill Title, Description, Venue, City
3. Upload cover image (or paste URL)
4. Set Event Start/End dates
5. Set Sales Start/End dates
6. Click "Create Event"
7. Event will be in "Draft" status
8. Go back to event → ✎ Edit Event Details
9. Switch to "Ticket Types" tab
10. Add ticket types
11. Go back to event → Admin Actions → 🚀 Publish Event

### Selling Tickets (Step by Step)
1. Dashboard → ➕ Create Event (follow steps above)
2. Add ticket types with prices and quantities
3. Publish event
4. Customers → 🌍 Browse Events → Find your event
5. Click event → "Purchase Tickets"
6. Select quantities and complete checkout
7. Customers go to payment → Payment gateway
8. After payment → Tickets automatically issued
9. Use 📱 Check-in Scanner at event to validate tickets

---

## 🎯 Common Tasks

| Task | Path |
|------|------|
| Create event | Dashboard → ➕ Create Event |
| Edit event info | Event Detail → ✎ Edit Event Details |
| Add/manage tickets | Event Detail → ✎ Edit Event Details → Ticket Types tab |
| Publish event | Event Detail → 🚀 Publish Event |
| Check-in guests | Event Detail → 📱 Check-in Scanner |
| View event stats | Event Detail → 📊 View Analytics |
| Browse public events | Dashboard → 🌍 Browse Events |
| Buy tickets | Browse Events → Find event → Purchase Tickets |
| Track order | Check email link or go to /orders/:id |

---

## 💡 Pro Tips

✅ **Always add ticket types before publishing**
- Events can't be published without at least one active ticket type

✅ **Set correct sales windows**
- Sales start should be now or in the past
- Sales end should be before event ends

✅ **Upload event images**
- Makes events more attractive to buyers
- Use PNG, JPG, or GIF (max 5MB)

✅ **Check in guests**
- Use the scanner at the event
- Prevents duplicate entries
- Tracks attendance

✅ **Monitor analytics**
- Track sales and revenue in real-time
- See occupancy rates
- Monitor check-in rates and no-shows

---

## 🆘 If You Can't Find Something

| What You're Looking For | Where to Go |
|-------------------------|-------------|
| Edit event details | Event Detail → Admin Actions → ✎ Edit Event Details |
| Add tickets | Event Detail → ✎ Edit → Ticket Types tab |
| Check who checked in | Event Detail → 📱 Scanner → Check-in History |
| See how many tickets sold | Event Detail → 📊 Analytics |
| Make event available for sale | Event Detail → Admin Actions → 🚀 Publish |
| Help with creating event | See "Creating an Event" section above |

---

Enjoy using EventFlow! 🎉
