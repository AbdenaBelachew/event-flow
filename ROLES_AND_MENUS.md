# EventFlow - Roles, Permissions & Menu Structure

## 👥 User Roles

EventFlow has **3 user roles** with different permissions:

### 1. **Super Admin** (System Administrator)
- Can manage all companies and users
- Can view all events
- Can moderate platform
- **Status:** Backend only (not implemented in frontend)

### 2. **Company Admin** (Event Organizer)
- Create and manage their own events
- Create ticket types
- Publish events
- View event analytics
- Check-in staff at events
- Access to all admin menus

### 3. **Event Staff** (Gate Staff)
- Check-in attendees at assigned event
- View QR code scanner
- Limited to one assigned event
- Cannot create/edit events
- Cannot see analytics

---

## 📍 Menu Locations by Role

### **ALL USERS (Logged In or Guest)**

```
HOMEPAGE (/)
├── Navigation Bar:
│   ├── 🏠 Logo (home)
│   ├── 🌍 Browse Events
│   ├── 🔐 Login (if not logged in)
│   ├── 📝 Register (if not logged in)
│   └── [If logged in]
│       ├── ➕ Create Event
│       ├── My Events (Dashboard)
│       └── Logout
```

---

### **COMPANY ADMIN MENUS**

#### **1. Dashboard** (`/dashboard`)
```
Navigation:
├── 🏠 EventFlow Logo → Homepage
├── 🌍 Browse Events → Public events page
├── ➕ Create Event → Event creation form
├── [Your Name] → Current user
└── Logout → Sign out

Content Area:
├── Header: "Dashboard" + Create Event button
└── Events Grid
    └── [For Each Event]
        ├── Event Cover Image
        ├── Title & Status Badge
        ├── Description (truncated)
        ├── Date
        └── Click to view details
```

#### **2. Create Event** (`/events/create`)
```
Navigation:
├── ← Back to Dashboard
├── EventFlow Logo
└── (Navigation bar)

Form Fields:
├── 📋 Event Title (required)
├── 📝 Description
├── 🏞️ Cover Image (file upload or URL)
├── 🏢 Venue
├── 🏙️ City
├── 📅 Event Start Date/Time (required)
├── 📅 Event End Date/Time (required)
├── 📅 Sales Start Date/Time (required)
├── 📅 Sales End Date/Time (required)
└── Buttons: [Create Event] [Cancel]
```

#### **3. Event Detail** (`/events/:id`)
```
Navigation:
├── ← Back to Dashboard
├── EventFlow Logo
└── (Navigation bar)

Left Column (2/3 width):
├── Event Cover Image
├── Title + Status Badge
├── Description
├── Event Details Card
│   ├── Venue
│   ├── City
│   ├── Event Date/Time
│   ├── Sales Start Date
│   └── Sales End Date
├── Ticket Types Card
│   └── [For Each Ticket Type]
│       ├── Ticket Name
│       ├── Price
│       ├── Remaining/Total
│       └── Status (On Sale / Sold Out / etc.)
└── [If on sale] Buy Tickets Card
    └── Purchase Tickets Button

Right Column (1/3 width) - Admin Only:
├── Admin Actions Card (Company Admin only)
│   ├── ✎ Edit Event Details
│   ├── 📊 View Analytics
│   ├── 📱 Check-in Scanner
│   └── 🚀 Publish Event (if draft)
```

#### **4. Edit Event** (`/events/:id/edit`)
```
Navigation:
├── ← Back to Event
├── EventFlow Logo
└── (Navigation bar)

Tabs:
├── Event Details Tab
│   ├── Title
│   ├── Description
│   ├── Venue
│   ├── City
│   ├── Event Dates
│   ├── Sales Period
│   ├── Cover Image URL
│   ├── Buttons: [Save Changes] [Publish Event]
│   └── Status: Draft / Published / etc.
│
└── Ticket Types Tab
    ├── Add Ticket Type Form
    │   ├── Ticket Name
    │   ├── Price (ETB)
    │   ├── Quantity
    │   └── Button: [Add Ticket Type]
    │
    └── Existing Ticket Types List
        └── [For Each Ticket Type]
            ├── Name
            ├── Price
            ├── Sold/Total count
            └── Active/Inactive status
```

#### **5. Event Analytics** (`/events/:id/stats`)
```
Navigation:
├── ← Back to Event
├── EventFlow Logo
└── (Navigation bar)

Top Cards (Key Metrics):
├── 📊 Total Capacity: [number]
├── 🎟️ Tickets Sold: [number] + occupancy %
├── 💰 Total Revenue: [amount] ETB
└── ✅ Checked In: [number] + percentage of issued

Detailed Stats (3 cards):
├── Check-in Summary
│   ├── Tickets Issued
│   ├── Checked In
│   ├── No Shows
│   └── No Show Rate %
│
├── Sales Summary
│   ├── Total Capacity
│   ├── Sold
│   ├── Remaining
│   └── Occupancy Rate %
│
└── Revenue Summary
    ├── Total Revenue ETB
    ├── Average Per Ticket ETB
    └── Potential Revenue ETB

Ticket Types Breakdown Table:
├── Column: Ticket Type Name
├── Column: Price
├── Column: Total Quantity
├── Column: Quantity Sold
└── Column: Revenue ETB
```

#### **6. Check-in Scanner** (`/events/:id/scanner`)
```
Navigation:
├── ← Back to Event
├── EventFlow Logo
└── [Event Name]

Scanner Interface:
├── Input Field: "Scan or paste ticket code..."
├── Button: [Check In]
├── Stats: Checked in: [count]

Success/Error Display:
├── Green Alert: "✓ [Name] checked in"
├── Red Alert: "Invalid ticket" / "Already used" / etc.

Stats Counters:
├── Total Scanned: [count]
├── Checked In: [count] (green)
└── Errors: [count] (red)

Check-in History:
├── Max height with scroll
└── [For Each Entry]
    ├── Name + Ticket Code
    ├── Status (✓ or ✗)
    └── Timestamp

Buttons:
├── [Clear History] - Resets counters
└── [Instructions] - Help text
```

---

### **CUSTOMER MENUS (No Account Needed)**

#### **1. Browse Events** (`/browse`)
```
Navigation:
├── EventFlow Logo → Homepage
├── 🌍 Browse Events (active)
├── [Not Logged In]:
│   ├── Sign In
│   └── Organize Event
├── [If Logged In]:
│   ├── My Events
│   └── Logout

Search & Filter:
├── Search Box: "Search by name or description..."
├── City Dropdown: "All Cities" / [City Names]
└── Button: [Clear Filters]

Events Grid:
└── [For Each Event]
    ├── Cover Image
    ├── Title
    ├── Venue/City
    ├── Status Badge (Published / Draft)
    ├── Description (truncated)
    ├── Date & Time
    └── Button: [Get Tickets]
```

#### **2. Event Detail (Public)** (`/events/:id`)
```
Navigation:
├── ← Back to Browse
├── EventFlow Logo
└── (Navigation bar)

Content:
├── Cover Image
├── Title + Status
├── Description
├── Event Details
├── Ticket Types
└── [If on sale] Button: [Get Tickets]
```

#### **3. Checkout** (`/events/:id/checkout`)
```
Navigation:
├── ← Back to Event
├── EventFlow Logo
└── (Navigation bar)

Left Column (2/3 width):
├── Buyer Information Form
│   ├── Full Name (required)
│   ├── Email (required)
│   └── Phone Number (required)
│
├── Select Tickets
│   └── [For Each Ticket Type]
│       ├── Ticket Name
│       ├── Price
│       ├── Available Count
│       ├── Quantity Selector (+/- buttons)
│       └── Status (On Sale / Not Available / Sold Out)
│
└── Button: [Continue to Payment]

Right Column (1/3 width) - Order Summary:
├── Event Cover Image
├── Event Name
├── Date
├── Location
├── (Divider)
├── [For Each Selected Ticket]
│   ├── Quantity × Ticket Name
│   └── Price
├── (Divider)
├── Total: [Amount] ETB
└── Total Tickets: [Count]
```

#### **4. Order Tracking** (`/orders/:id`)
```
Navigation:
├── ← Back to Home
├── EventFlow Logo
└── (Navigation bar)

Order Header:
├── Order ID
├── Date/Time
└── Status Badge (Pending / Paid / Failed)

Order Details Card:
├── Buyer Name
├── Email
├── Phone
└── Total Amount

Tickets Card:
├── [If pending payment]
│   └── "Tickets will be generated after payment"
└── [If paid]
    └── [For Each Ticket]
        ├── QR Code Placeholder
        ├── Holder Name
        └── Status Badge (Valid / Used / etc.)

Payment Section (if pending):
├── Payment Gateway Options:
│   ├── ⭕ Chapa (selected)
│   ├── ⭕ Telebirr
│   └── ⭕ CBE Birr
├── Button: [Pay X ETB]
└── Instructions

[If Paid]:
└── Green Alert: "✓ Payment Confirmed"
    └── "Your tickets are ready to use"
```

#### **5. Payment Callback** (`/payment-callback`)
```
Success State:
├── ✓ Checkmark
├── "Payment Successful"
├── "Your tickets have been sent to your email"
└── Button: [Back to Home]

Failure State:
├── ✗ X Mark
├── "Payment Failed"
├── Error message
├── "Please try again or contact support"
└── Button: [Back to Home]
```

---

## 🔐 Permission Matrix

| Feature | Super Admin | Company Admin | Event Staff | Guest |
|---------|------------|--------------|------------|--------|
| **Create Event** | ✅ | ✅ | ❌ | ❌ |
| **Edit Event** | ✅ | ✅ (own only) | ❌ | ❌ |
| **Publish Event** | ✅ | ✅ (own only) | ❌ | ❌ |
| **Add Ticket Types** | ✅ | ✅ (own only) | ❌ | ❌ |
| **View Analytics** | ✅ | ✅ (own only) | ❌ | ❌ |
| **Check-in** | ✅ | ✅ (own events) | ✅ (assigned) | ❌ |
| **Browse Events** | ✅ | ✅ | ✅ | ✅ |
| **Buy Tickets** | ✅ | ✅ | ✅ | ✅ |
| **View Order** | ✅ | ✅ | ✅ | ✅ |
| **Process Payment** | ✅ | ✅ | ✅ | ✅ |

---

## 🚦 Access Control Flow

```
User Visits Site
│
├─ [Not Logged In]
│  ├─ Can view: Homepage, Browse Events, Event Details (published only)
│  ├─ Can do: Browse, Search, Buy tickets, Checkout, Payment
│  └─ Cannot: Create events, Edit events, Access dashboard
│
├─ [Company Admin - Logged In]
│  ├─ Can view: Dashboard, All their events, Analytics
│  ├─ Can do: Everything guest can + Create/Edit/Publish events
│  ├─ Can do: Check-in, View stats, Manage tickets
│  └─ Cannot: See other company's events (edit/delete)
│
└─ [Event Staff - Logged In]
   ├─ Can view: Assigned event's scanner page
   ├─ Can do: Check-in attendees
   └─ Cannot: Create events, View other events' details
```

---

## 📋 Navigation Paths by Role

### **Company Admin Workflow**
```
Register → Login → Dashboard
                      │
                      ├─ [Create Event] → Create form → Event detail
                      │
                      ├─ [Click Event] → Event detail
                      │   ├─ [Edit] → Edit form
                      │   ├─ [Analytics] → Stats page
                      │   ├─ [Scanner] → Check-in
                      │   └─ [Publish] → Published
                      │
                      ├─ [Browse] → Browse events
                      └─ [Logout]
```

### **Customer Workflow**
```
Homepage
│
├─ Browse Events → Event list
│  │
│  └─ [Click Event] → Event detail
│     │
│     ├─ [Get Tickets] → Checkout
│     │  │
│     │  ├─ Fill buyer info
│     │  ├─ Select tickets
│     │  └─ [Continue] → Order page
│     │
│     └─ Order page → Payment
│        │
│        ├─ Select gateway
│        └─ [Pay] → Payment gateway
│           │
│           └─ Return → Payment callback
│              ├─ Success → Tickets issued
│              └─ Failure → Try again
```

---

## 🔍 How to Find Specific Features

| Feature | Who Can Access | Where to Find |
|---------|---|---|
| Create Event | Company Admin | Dashboard → ➕ Create Event |
| Edit Event | Company Admin | Event → ✎ Edit Event Details |
| Add Tickets | Company Admin | Event → ✎ Edit → Ticket Types tab |
| Publish Event | Company Admin | Event → 🚀 Publish Event |
| Check-in | Staff/Admin | Event → 📱 Check-in Scanner |
| Analytics | Company Admin | Event → 📊 View Analytics |
| Browse Events | Everyone | Homepage → 🌍 Browse Events |
| Buy Tickets | Everyone | Browse → Event → Get Tickets |
| Track Order | Customers | Direct link or Dashboard |

---

## 🎯 Quick Start by Role

### **If you're an EVENT ORGANIZER:**
1. Go to `/register` → Create account
2. Go to `/dashboard` → Click "➕ Create Event"
3. Fill event details & upload image
4. Click "Create Event"
5. Click "✎ Edit Event Details" → Go to "Ticket Types" tab
6. Add ticket types (name, price, quantity)
7. Go back to event → Click "🚀 Publish Event"
8. Event is now live! Customers can buy tickets
9. Use "📱 Check-in Scanner" at the event

### **If you're a CUSTOMER:**
1. Go to `/browse`
2. Search or filter events
3. Click on event you like
4. Click "Purchase Tickets"
5. Select ticket types & quantities
6. Enter your name, email, phone
7. Click "Continue to Payment"
8. Choose payment method
9. Complete payment
10. Receive tickets via email

### **If you're EVENT STAFF:**
1. Log in with staff account
2. Go to your assigned event
3. Click "📱 Check-in Scanner"
4. Scan QR code or enter ticket code
5. See confirmation
6. Repeat for each guest

---

This covers all menus, roles, and how access works in EventFlow! 🎉
