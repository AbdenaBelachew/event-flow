-- Gate staff: scope event_staff users to a single event
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS assigned_event_id UUID REFERENCES events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_assigned_event
  ON users(assigned_event_id)
  WHERE assigned_event_id IS NOT NULL;

-- Ensure event_staff is allowed on the role check (older DBs may lack it)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_role_check'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;
END $$;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('super_admin', 'company_admin', 'event_staff'));
