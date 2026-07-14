-- Manual payment proof + admin approval flow
-- Buyers pay on phone, submit tx + reference codes; admin approves → tickets issued.

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS buyer_tx_code VARCHAR(150),
  ADD COLUMN IF NOT EXISTS buyer_reference VARCHAR(150),
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_note TEXT;

-- Expand payment status to include awaiting_approval
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payments_status_check'
      AND conrelid = 'payments'::regclass
  ) THEN
    ALTER TABLE payments DROP CONSTRAINT payments_status_check;
  END IF;
END $$;

ALTER TABLE payments
  ADD CONSTRAINT payments_status_check
  CHECK (status IN ('initiated', 'awaiting_approval', 'success', 'failed'));

CREATE INDEX IF NOT EXISTS idx_payments_awaiting
  ON payments(status) WHERE status = 'awaiting_approval';
