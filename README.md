# EventFlow

Multi-tenant event ticketing platform — React frontend + Express/PostgreSQL backend.

## Quick start

### Backend

```bash
cd backend
cp .env.example .env   # set DATABASE_URL + JWT_SECRET
npm install
npm run migrate
npm run seed
npm start              # http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

### Seeded logins

Password for all: `Password123!`

| Role | Email | Lands on |
|------|-------|----------|
| System owner | `owner@eventflow.et` | `/admin` |
| Company admin | `admin@addisevents.et` | `/dashboard` |
| Door staff | `staff@addisevents.et` | Assigned event scanner |

## Main routes

| Page | Path | Who |
|------|------|-----|
| Browse events | `/browse` | Public |
| Find tickets | `/tickets` | Public |
| Login | `/login` | Public |
| Dashboard | `/dashboard` | Company admin |
| Create event | `/events/create` | Company admin |
| Edit event | `/events/:id/edit` | Company admin |
| Event stats | `/events/:id/stats` | Admin / staff |
| Payments | `/events/:id/payments` | Company admin |
| Door scanner | `/events/:id/scanner` | Admin / staff |
| Public event | `/events/:id` | Public |
| Platform admin | `/admin` | System owner |

## Organizer flow

1. **Create** — `/events/create` — name, cover, dates, venue  
2. **Edit** — `/events/:id/edit` — save details, add ticket types, publish  
3. **Stats** — `/events/:id/stats` — revenue, sell-through, check-ins, no-shows  
4. **Scanner** — `/events/:id/scanner` — QR check-in at the door  

## Stack

- **Frontend:** React, Vite, TanStack Query, React Router, Tailwind  
- **Backend:** Express, PostgreSQL, JWT auth, QR tickets  

See [`backend/README.md`](backend/README.md) for API details, migrations, and backend UI notes.
