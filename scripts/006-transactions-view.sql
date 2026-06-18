-- ============================================================
-- 006 - User-facing transactions view derived from the ledger.
-- Source of truth = ledger_legs on each user's cash account.
-- Running balance computed with a window function.
-- ============================================================

CREATE OR REPLACE VIEW transactions AS
SELECT
  l.id::text                                   AS id,
  a.user_id                                    AS user_id,
  CASE e.kind
    WHEN 'deposit'    THEN 'deposit'
    WHEN 'withdrawal' THEN 'withdrawal'
    WHEN 'trade'      THEN (CASE WHEN l.amount < 0 THEN 'trade_buy' ELSE 'trade_sell' END)
    WHEN 'settlement' THEN 'settlement'
    WHEN 'fee'        THEN 'fee'
    ELSE 'adjustment'
  END                                          AS type,
  'completed'                                  AS status,
  l.amount                                     AS amount_cents,
  SUM(l.amount) OVER (
    PARTITION BY a.user_id
    ORDER BY e.created_at, l.id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  )                                            AS balance_after_cents,
  e.memo                                       AS description,
  e.reference_id::text                         AS reference,
  e.created_at                                 AS created_at
FROM ledger_legs l
JOIN ledger_entries e ON e.id = l.entry_id
JOIN accounts a ON a.id = l.account_id
WHERE a.kind = 'user_cash' AND a.user_id IS NOT NULL;
