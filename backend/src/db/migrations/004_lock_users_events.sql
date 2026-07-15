-- Platform owner can lock users (block login) and events (hide from public / block sales)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_is_locked ON users(is_locked) WHERE is_locked = true;
CREATE INDEX IF NOT EXISTS idx_events_is_locked ON events(is_locked) WHERE is_locked = true;
