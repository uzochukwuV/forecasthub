-- ============================================================
-- 004 - Stripe deposits & withdrawals
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  direction           VARCHAR(10) NOT NULL CHECK (direction IN ('deposit','withdrawal')),
  amount_cents        BIGINT NOT NULL CHECK (amount_cents > 0),
  currency            CHAR(3) NOT NULL DEFAULT 'USD',
  status              VARCHAR(16) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','processing','succeeded','failed','canceled')),
  stripe_session_id   VARCHAR(128),
  stripe_payment_intent VARCHAR(128),
  stripe_payout_id    VARCHAR(128),
  ledger_entry_id     UUID REFERENCES ledger_entries(id),
  failure_reason      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_session ON payments(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_intent ON payments(stripe_payment_intent) WHERE stripe_payment_intent IS NOT NULL;

DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Idempotency log for Stripe webhook events (exactly-once processing).
CREATE TABLE IF NOT EXISTS webhook_events (
  id           VARCHAR(128) PRIMARY KEY,  -- stripe event id
  type         VARCHAR(64) NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Append-only audit trail for sensitive actions.
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(48) NOT NULL,
  detail      JSONB,
  ip          INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id, created_at DESC);
