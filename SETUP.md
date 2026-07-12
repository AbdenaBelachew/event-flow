# EventFlow Setup Guide

## Prerequisites

### 1. PostgreSQL Database

You need PostgreSQL 12+ installed and running.

**Windows Installation:**
- Download from https://www.postgresql.org/download/windows/
- During installation, remember your password for the `postgres` user
- PostgreSQL runs on port 5432 by default

**Verify Installation:**
```bash
psql --version
```

### 2. Backend Database Setup

Once PostgreSQL is running, create the database and run migrations:

```bash
cd backend

# Create the database
createdb -U postgres events_db

# Run migrations to create tables
npm run migrate

# (Optional) Seed with test data
npm run seed
```

**If you get permission denied:**
- On Windows: PostgreSQL usually includes `psql` and `createdb` tools. Make sure they're in PATH
- Alternatively, use pgAdmin GUI that comes with PostgreSQL installer

### 3. Environment Variables

The backend already has `.env` configured. Verify it matches your PostgreSQL:

```
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=794613  # Change this if your password is different
PGDATABASE=events_db
```

### 4. Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
```
Should output: `🎟 Ticketing backend listening on http://localhost:4000`

**Terminal 2 - Frontend:**
```bash
npm install
npm run dev
```
Should show Vite dev server running on `http://localhost:5173`

## Testing the Connection

1. Open `http://localhost:5173` in your browser
2. Click "Get Started" → "Create Account"
3. Fill in the form and submit
4. If successful, you'll be redirected to the dashboard

## Troubleshooting

### "Can't create account" / Connection errors

**Check backend is running:**
- Terminal should show `🎟 Ticketing backend listening on http://localhost:4000`

**Check database exists:**
```bash
psql -U postgres -l
# Should show: events_db in the list
```

**Check migrations ran:**
```bash
psql -U postgres -d events_db -c "\dt"
# Should show: companies, users, events, etc.
```

**Check API connectivity:**
- Open `http://localhost:4000/api/health` in browser
- Should return: `{"ok":true,"ts":"..."}`

### Database connection refused

**PostgreSQL not running:**
- Windows: Start PostgreSQL from Services (services.msc)
- Or start via: `pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start`

### Port already in use

- Backend: Change `PORT` in `backend/.env` (default: 4000)
- Frontend: Vite will use next available port (usually 5174+)

## Next Steps

Once set up:
- Register a company and admin account
- Create your first event
- Add ticket types
- Publish and start selling!
