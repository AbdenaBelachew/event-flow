-- =====================================================================
-- Ticket Generating & Validation System — initial schema
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- provides gen_random_uuid()

-- Companies (organizers)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) UNIQUE NOT NULL,
  contact_email VARCHAR(150) NOT NULL,
  contact_phone VARCHAR(30),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Platform users (staff/admins, not buyers)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin','company_admin','event_staff')),
  -- Optional: scope event_staff to a single event (gate staff isolation)
  assigned_event_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  venue VARCHAR(200),
  city VARCHAR(100),
  event_start TIMESTAMPTZ NOT NULL,
  event_end TIMESTAMPTZ NOT NULL,
  sales_start TIMESTAMPTZ NOT NULL,
  sales_end TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','published','sold_out','closed','cancelled')),
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (sales_end <= event_end),
  CHECK (sales_start < sales_end)
);

-- staff -> event FK (added after events table exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_assigned_event_fk'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_assigned_event_fk
      FOREIGN KEY (assigned_event_id) REFERENCES events(id) ON DELETE SET NULL;
  END IF;
END$$;

-- Ticket types (tiers) per event
CREATE TABLE IF NOT EXISTS ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price_etb NUMERIC(12,2) NOT NULL CHECK (price_etb >= 0),
  quantity_total INTEGER NOT NULL CHECK (quantity_total > 0),
  quantity_sold INTEGER NOT NULL DEFAULT 0,
  sales_start TIMESTAMPTZ,
  sales_end TIMESTAMPTZ,
  max_per_order INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  CHECK (quantity_sold <= quantity_total)
);

-- Orders (a purchase, may hold multiple tickets)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id),
  buyer_name VARCHAR(150) NOT NULL,
  buyer_email VARCHAR(150) NOT NULL,
  buyer_phone VARCHAR(30) NOT NULL,
  total_amount_etb NUMERIC(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','failed','refunded','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payments (gateway transaction record, linked to an order)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  gateway VARCHAR(20) NOT NULL CHECK (gateway IN ('telebirr','chapa','cbe_birr')),
  gateway_ref VARCHAR(150),
  amount_etb NUMERIC(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'initiated'
    CHECK (status IN ('initiated','success','failed')),
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- gateway_ref must be unique per gateway so webhooks are idempotent
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_gateway_ref
  ON payments(gateway, gateway_ref) WHERE gateway_ref IS NOT NULL;

-- Individual tickets (one row = one admittable ticket)
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id),
  event_id UUID NOT NULL REFERENCES events(id),
  ticket_code VARCHAR(40) UNIQUE NOT NULL,
  holder_name VARCHAR(150),
  status VARCHAR(20) NOT NULL DEFAULT 'unpaid'
    CHECK (status IN ('unpaid','valid','used','void','refunded')),
  issued_at TIMESTAMPTZ DEFAULT now(),
  used_at TIMESTAMPTZ
);

-- Check-in log (every scan attempt, valid or not)
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  scanned_by UUID REFERENCES users(id),
  result VARCHAR(20) NOT NULL
    CHECK (result IN ('success','already_used','unpaid','invalid','wrong_event')),
  scanned_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_company ON events(company_id);
CREATE INDEX IF NOT EXISTS idx_ticket_types_event ON ticket_types(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_orders_event ON orders(event_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_ticket ON check_ins(ticket_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
