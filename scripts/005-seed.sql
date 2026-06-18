-- ============================================================
-- 005 - Seed system accounts, categories, and demo markets
-- ============================================================

-- House/system accounts (user_id NULL).
INSERT INTO accounts (kind, user_id)
SELECT k, NULL FROM (VALUES
  ('house_clearing'),
  ('house_fees'),
  ('house_liquidity'),
  ('external_stripe')
) AS t(k)
WHERE NOT EXISTS (
  SELECT 1 FROM accounts a WHERE a.kind = t.k AND a.user_id IS NULL
);

INSERT INTO account_balances (account_id, balance)
SELECT a.id, 0 FROM accounts a
WHERE a.user_id IS NULL
ON CONFLICT (account_id) DO NOTHING;

-- Categories
INSERT INTO categories (slug, name, sort) VALUES
  ('macro','Macro & Economics',1),
  ('crypto','Crypto',2),
  ('tech','Technology',3),
  ('politics','Politics',4),
  ('climate','Climate',5),
  ('sports','Sports',6)
ON CONFLICT (slug) DO NOTHING;

-- Demo markets (manually created per requirements)
INSERT INTO markets (slug, question, description, category_id, status, yes_price, liquidity_param, volume_cents, open_interest, closes_at)
SELECT * FROM (
  VALUES
    ('fed-rate-cut-q3', 'Will the Fed cut rates at the next FOMC meeting?', 'Resolves YES if the Federal Reserve announces a reduction to the federal funds target range at its next scheduled FOMC meeting.', (SELECT id FROM categories WHERE slug='macro'), 'open', 6800, 800000::bigint, 420000000::bigint, 18000000::bigint, now() + interval '21 days'),
    ('btc-150k-eoy', 'Will BTC trade above $150,000 by year end?', 'Resolves YES if the price of Bitcoin (Coinbase BTC-USD) is at or above $150,000 at any point before Dec 31, 23:59 UTC.', (SELECT id FROM categories WHERE slug='crypto'), 'open', 4100, 1200000::bigint, 1280000000::bigint, 52000000::bigint, now() + interval '120 days'),
    ('arc-agi-95', 'Will an AI model exceed 95% on ARC-AGI in 2026?', 'Resolves YES if any publicly verified model scores above 95% on the ARC-AGI benchmark within the calendar year.', (SELECT id FROM categories WHERE slug='tech'), 'open', 2300, 400000::bigint, 190000000::bigint, 9000000::bigint, now() + interval '200 days'),
    ('global-temp-record', 'Will a global temperature record be set this year?', 'Resolves YES if NOAA/NASA confirm a new annual global average temperature record.', (SELECT id FROM categories WHERE slug='climate'), 'open', 7700, 600000::bigint, 83000000::bigint, 4000000::bigint, now() + interval '160 days'),
    ('election-turnout-high', 'Will voter turnout exceed the prior cycle?', 'Resolves YES if certified turnout exceeds the previous comparable election cycle.', (SELECT id FROM categories WHERE slug='politics'), 'open', 5500, 700000::bigint, 220000000::bigint, 11000000::bigint, now() + interval '90 days'),
    ('superbowl-favorite', 'Will the current favorite win the championship?', 'Resolves YES if the pre-playoff betting favorite wins the title.', (SELECT id FROM categories WHERE slug='sports'), 'open', 3400, 500000::bigint, 310000000::bigint, 14000000::bigint, now() + interval '45 days')
) AS t(slug, question, description, category_id, status, yes_price, liquidity_param, volume_cents, open_interest, closes_at)
WHERE NOT EXISTS (SELECT 1 FROM markets m WHERE m.slug = t.slug);

-- Seed a couple of price ticks per market for charts.
INSERT INTO price_ticks (market_id, yes_price, volume_cents, created_at)
SELECT m.id,
       GREATEST(100, LEAST(9900, m.yes_price + (g.delta))),
       (random()*2000000)::bigint,
       now() - (g.n || ' hours')::interval
FROM markets m
CROSS JOIN LATERAL (
  SELECT generate_series(1,24) AS n, (random()*800-400)::int AS delta
) g
WHERE NOT EXISTS (SELECT 1 FROM price_ticks p WHERE p.market_id = m.id);
