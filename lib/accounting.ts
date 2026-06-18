import "server-only"
import type { PoolClient } from "pg"
import { query } from "@/lib/db"
import type { AccountBalance } from "@/lib/types"

export interface Leg {
  accountId: string
  // signed cents: positive = credit, negative = debit. Must sum to 0 across legs.
  amount: number
}

export type LedgerKind =
  | "deposit"
  | "withdrawal"
  | "trade"
  | "settlement"
  | "fee"
  | "adjustment"
  | "escrow_lock"
  | "escrow_release"

/**
 * Posts a balanced, atomic ledger entry and updates cached balances.
 * MUST be called inside a withTransaction() so the DB enforces consistency.
 * Throws on unbalanced legs or idempotency collision.
 */
export async function postEntry(
  client: PoolClient,
  params: {
    kind: LedgerKind
    legs: Leg[]
    referenceId?: string | null
    idempotencyKey?: string | null
    memo?: string | null
  },
): Promise<string> {
  const sum = params.legs.reduce((acc, l) => acc + l.amount, 0)
  if (sum !== 0) throw new Error(`Unbalanced ledger entry: legs sum to ${sum}`)
  if (params.legs.length < 2) throw new Error("Ledger entry needs at least two legs")

  const entryRes = await client.query(
    `INSERT INTO ledger_entries (kind, reference_id, idempotency_key, memo)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [params.kind, params.referenceId ?? null, params.idempotencyKey ?? null, params.memo ?? null],
  )
  const entryId = entryRes.rows[0].id as string

  for (const leg of params.legs) {
    await client.query(
      `INSERT INTO ledger_legs (entry_id, account_id, amount) VALUES ($1, $2, $3)`,
      [entryId, leg.accountId, leg.amount],
    )
    // Upsert + atomic increment of the cached balance.
    await client.query(
      `INSERT INTO account_balances (account_id, balance, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (account_id)
       DO UPDATE SET balance = account_balances.balance + EXCLUDED.balance, updated_at = now()`,
      [leg.accountId, leg.amount],
    )
  }

  return entryId
}

// Fetch (and lock, when client provided) a user's account ids by kind.
export async function getUserAccountIds(
  client: PoolClient,
  userId: string,
): Promise<{ cash: string; escrow: string }> {
  const res = await client.query<{ id: string; kind: string }>(
    `SELECT id, kind FROM accounts WHERE user_id = $1 AND kind IN ('user_cash','user_escrow')`,
    [userId],
  )
  const cash = res.rows.find((r) => r.kind === "user_cash")?.id
  const escrow = res.rows.find((r) => r.kind === "user_escrow")?.id
  if (!cash || !escrow) throw new Error("User accounts missing")
  return { cash, escrow }
}

// Fetch a system account id by kind.
export async function getSystemAccountId(client: PoolClient, kind: string): Promise<string> {
  const res = await client.query<{ id: string }>(
    `SELECT id FROM accounts WHERE user_id IS NULL AND kind = $1 LIMIT 1`,
    [kind],
  )
  if (!res.rows[0]) throw new Error(`System account ${kind} missing`)
  return res.rows[0].id
}

// Read a user's available + reserved (escrow) balances for the dashboard/wallet.
export async function getBalances(userId: string): Promise<AccountBalance> {
  const { rows } = await query<{ kind: string; balance: string }>(
    `SELECT a.kind, COALESCE(b.balance, 0) AS balance
     FROM accounts a
     LEFT JOIN account_balances b ON b.account_id = a.id
     WHERE a.user_id = $1 AND a.kind IN ('user_cash','user_escrow')`,
    [userId],
  )
  const available = Number(rows.find((r) => r.kind === "user_cash")?.balance ?? 0)
  const reserved = Number(rows.find((r) => r.kind === "user_escrow")?.balance ?? 0)
  return { available_cents: available, reserved_cents: reserved, total_cents: available + reserved }
}
