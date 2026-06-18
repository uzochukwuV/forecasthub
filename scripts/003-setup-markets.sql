-- ============================================================
-- 003 - Markets, orders, positions, price history
-- Prices/probabilities stored as basis points (0..10000).
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id     SERIAL PRIMARY KEY,
  slug   VARCHAR(48) NOT NULL UNIQUE,
  name   VARCHAR(64) NOT NULL,
  sort   INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS markets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            VARCHAR(96) NOT NULL UNIQUE,
  question        TEXT NOT NULL,
  description     TEXT,
  category_id     INT REFERENCES categories(id) ON DELETE SET NULL,
  status          VARCHAR(16) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('draft','open','closed','resolved','void')),
  -- current YES price in bps; NO price = 10000 - yes_price
  yes_price       INT NOT NULL DEFAULT 5000 CHECK (yes_price BETWEEN 0 AND 10000),
  -- LMSR liquidity parameter (b), in cents, controls depth
  liquidity_param BIGINT NOT NULL DEFAULT 500000,
  -- outstanding shares (for AMM pricing)
  yes_shares      BIGINT NOT NULL DEFAULT 0,
  no_shares       BIGINT NOT NULL DEFAULT 0,
  volume_cents    BIGINT NOT NULL DEFAULT 0,
  open_interest   BIGINT NOT NULL DEFAULT 0,
  resolution      VARCHAR(8) CHECK (resolution IN ('yes','no','void')),
  closes_at       TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_category ON markets(category_id);
CREATE INDEX IF NOT EXISTS idx_markets_closes ON markets(closes_at);

DROP TRIGGER IF EXISTS trg_markets_updated_at ON markets;
CREATE TRIGGER trg_markets_updated_at BEFORE UPDATE ON markets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Orders = a user's "bet". status open/closed maps to position lifecycle.
CREATE TABLE IF NOT EXISTS orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  market_id     UUID NOT NULL REFERENCES markets(id) ON DELETE RESTRICT,
  side          VARCHAR(3) NOT NULL CHECK (side IN ('yes','no')),
  action        VARCHAR(4) NOT NULL CHECK (action IN ('buy','sell')),
  shares        BIGINT NOT NULL CHECK (shares > 0),
  avg_price     INT NOT NULL CHECK (avg_price BETWEEN 0 AND 10000), -- bps paid per share
  cost_cents    BIGINT NOT NULL,           -- total cents moved (incl. fee)
  fee_cents     BIGINT NOT NULL DEFAULT 0,
  status        VARCHAR(8) NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','closed','void')),
  realized_pnl  BIGINT,                     -- set when closed/settled
  ledger_entry_id UUID REFERENCES ledger_entries(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_market ON orders(market_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);

-- Net position per (user, market, side) - aggregates fills for quick reads.
CREATE TABLE IF NOT EXISTS positions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  market_id     UUID NOT NULL REFERENCES markets(id) ON DELETE RESTRICT,
  side          VARCHAR(3) NOT NULL CHECK (side IN ('yes','no')),
  shares        BIGINT NOT NULL DEFAULT 0,
  avg_cost      INT NOT NULL DEFAULT 0,   -- bps
  realized_pnl  BIGINT NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_position UNIQUE (user_id, market_id, side)
);
CREATE INDEX IF NOT EXISTS idx_positions_user ON positions(user_id);

-- Price history for charts / realtime ticks.
CREATE TABLE IF NOT EXISTS price_ticks (
  id          BIGSERIAL PRIMARY KEY,
  market_id   UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  yes_price   INT NOT NULL CHECK (yes_price BETWEEN 0 AND 10000),
  volume_cents BIGINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticks_market_time ON price_ticks(market_id, created_at DESC);
