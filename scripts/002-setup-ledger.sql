-- ============================================================
-- 002 - Double-entry ledger (the source of truth for money)
-- All amounts are in integer USD cents. Never floats.
-- ============================================================

-- Every account belongs either to a user or to the house/system.
CREATE TABLE IF NOT EXISTS accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE RESTRICT,
  kind        VARCHAR(24) NOT NULL
                CHECK (kind IN ('user_cash','user_escrow','house_clearing','house_fees','house_liquidity','external_stripe')),
  currency    CHAR(3) NOT NULL DEFAULT 'USD',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- A user has exactly one cash + one escrow account; system accounts have null user_id.
  CONSTRAINT uq_user_account UNIQUE (user_id, kind)
);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);

-- A ledger entry is an atomic, balanced transfer (sum of legs = 0).
CREATE TABLE IF NOT EXISTS ledger_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind          VARCHAR(32) NOT NULL
                  CHECK (kind IN ('deposit','withdrawal','trade','settlement','fee','adjustment','escrow_lock','escrow_release')),
  reference_id  UUID,             -- links to order / market / payment
  idempotency_key VARCHAR(128),   -- prevents double-posting
  memo          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_idempotency
  ON ledger_entries(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ledger_reference ON ledger_entries(reference_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON ledger_entries(created_at DESC);

-- The individual debit/credit legs. Credits are positive, debits negative.
CREATE TABLE IF NOT EXISTS ledger_legs (
  id          BIGSERIAL PRIMARY KEY,
  entry_id    UUID NOT NULL REFERENCES ledger_entries(id) ON DELETE CASCADE,
  account_id  UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  amount      BIGINT NOT NULL,  -- cents, signed; +credit / -debit
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_legs_entry ON ledger_legs(entry_id);
CREATE INDEX IF NOT EXISTS idx_legs_account ON ledger_legs(account_id);

-- Materialized running balance per account for fast reads (kept in sync in app txns).
CREATE TABLE IF NOT EXISTS account_balances (
  account_id  UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  balance     BIGINT NOT NULL DEFAULT 0,  -- cents
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enforce that every ledger entry's legs sum to zero (deferred to txn commit).
CREATE OR REPLACE FUNCTION assert_entry_balanced()
RETURNS TRIGGER AS $$
DECLARE
  total BIGINT;
BEGIN
  SELECT COALESCE(SUM(amount),0) INTO total FROM ledger_legs WHERE entry_id = NEW.entry_id;
  IF total <> 0 THEN
    RAISE EXCEPTION 'Ledger entry % is unbalanced: sum=%', NEW.entry_id, total;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
