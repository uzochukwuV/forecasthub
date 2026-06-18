-- ============================================================
-- 001 - Identity: users, sessions, auth
-- Money is NEVER stored here. See 002 for the ledger.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Reusable trigger to keep updated_at fresh.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(320) NOT NULL,
  email_normalized VARCHAR(320) NOT NULL,
  -- scrypt/argon style: we store algorithm + salt + hash in one string
  password_hash   TEXT NOT NULL,
  display_name    VARCHAR(80) NOT NULL,
  role            VARCHAR(16) NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user', 'admin')),
  status          VARCHAR(16) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'suspended', 'closed')),
  kyc_status      VARCHAR(16) NOT NULL DEFAULT 'none'
                    CHECK (kyc_status IN ('none', 'pending', 'verified', 'rejected')),
  stripe_customer_id VARCHAR(64),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive uniqueness on email.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_normalized ON users(email_normalized);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Opaque server-side sessions. We store only a SHA-256 hash of the token.
CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    CHAR(64) NOT NULL,
  user_agent    TEXT,
  ip            INET,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
