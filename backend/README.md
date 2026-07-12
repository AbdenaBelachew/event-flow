# Ticket Generating & Validation System — Backend

Multi-tenant event ticketing platform. **Express + PostgreSQL**, JWT auth, QR
tickets, row-locked no-oversell purchasing, idempotent payment webhooks, and a
strict check-in validation endpoint. Ships with a self-contained web UI (public
sales page, mock gateway checkout, camera-based gate scanner, organizer
dashboard).

> This is a standalone Node.js project. It runs on any Node host with a
> PostgreSQL database — `cd backend && npm install && npm start`. It is **not**
> part of / does not run inside the surrounding Lovable preview.

## Quick start

```bash
cd backend
cp .env.example .env          # edit DATABASE_URL + JWT_SECRET
npm install
npm run migrate               # create schema
npm run seed                  # demo company, event, ticket types, users
npm start                     # http://localhost:4000
```

Seeded logins (password `Password123!`):
- Organizer admin: `admin@addisevents.et`
- Gate staff:      `staff@addisevents.et`

The seed prints the demo **Event ID** — open `http://localhost:4000/?event=<id>`.

## Web UI

| Page | URL | Purpose |
|------|-----|---------|
| Public sales | `/?event=<id>` | Live availability + guest checkout |
| Mock checkout | `/checkout-mock.html` | Simulated gateway (when no key set) |
| Order / tickets | `/order.html?id=<orderId>` | QR tickets after payment |
| Gate scanner | `/scanner.html` | Camera QR scanning + check-in |
| Dashboard | `/dashboard.html` | Sales, revenue, check-in feed, CSV export |

## Payments

Gateways implement one interface (`initiate`, `verify`, `parseWebhook`) in
`src/modules/payments/gateways/`. **Chapa** is the primary integration; set
`CHAPA_SECRET_KEY` to go live. **Telebirr** and **CBE Birr** are stubs behind
the same interface. With no keys configured, all three run in **simulation
mode** so the full sales → payment → ticket flow works locally.

Webhooks are **idempotent** — payments are keyed by `(gateway, gateway_ref)`
and a locked payment row short-circuits retries so tickets are never issued
twice.

## Key business rules

- **No overselling** — stock is reserved inside a transaction with
  `SELECT ... FOR UPDATE` on `ticket_types` (see `orders.routes.js`).
- **Sales window** — purchases rejected outside the event/ticket-type window or
  if the event isn't `published`.
- **Payment-gated tickets** — created `unpaid`, flipped to `valid` only by a
  successful payment webhook.
- **Check-in logic** (`tickets.routes.js`) — resolves to
  `invalid | wrong_event | unpaid | already_used | success`; the `valid→used`
  flip is row-locked (anti-duplication); **every** attempt is logged to
  `check_ins`.
- **Rate limiting** on the check-in endpoint prevents scan-spam.

## API surface

```
POST   /api/auth/register-company
POST   /api/auth/login
GET    /api/auth/me

POST   /api/events                          (company_admin)
GET    /api/events/:id
PATCH  /api/events/:id
POST   /api/events/:id/publish
GET    /api/events/:id/availability         (public)
GET    /api/events/:id/stats
GET    /api/events/:id/export               (CSV)
GET    /api/events/:id/check-ins
GET    /api/companies/:id/events

POST   /api/events/:eventId/ticket-types
GET    /api/events/:eventId/ticket-types    (public)
PATCH  /api/ticket-types/:id

POST   /api/orders                          (guest checkout)
GET    /api/orders/:id
POST   /api/orders/:id/pay
POST   /api/payments/webhook/:gateway       (idempotent)

GET    /api/tickets/:code                   (ticket + QR)
POST   /api/tickets/:code/check-in          (event_staff)
```

## Folder structure

```
backend/
  server.js, app.js
  src/
    config/        env.js, db.js (pool + withTransaction)
    db/            migrations/001_init.sql, migrate.js, seed.js
    middleware/    auth, roleGuard, errorHandler, rateLimit
    utils/         qrGenerator, ticketCodeGenerator, asyncHandler, ApiError
    modules/
      auth companies events ticketTypes orders tickets checkIns
      payments/gateways/ (chapa, telebirr, cbeBirr, index)
    routes/index.js
  public/          index, checkout-mock, order, scanner, dashboard, style.css
```

## Not yet implemented (recommended additions from the spec)

Email/SMS delivery, promo codes, waitlist, refund UI, multi-session events.
The refund primitive (`releaseOrder`) exists in `tickets.service.js`.
