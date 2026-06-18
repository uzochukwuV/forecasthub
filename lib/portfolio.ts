import "server-only"
import { query } from "@/lib/db"
import type { BetRow, TransactionRow } from "@/lib/types"

/**
 * Bets = a user's orders joined with the live market price so we can compute
 * mark-to-market value and unrealized P&L. status open/closed comes from the order.
 */
export async function getUserBets(
  userId: string,
  opts?: { status?: "open" | "closed" },
): Promise<BetRow[]> {
  const params: unknown[] = [userId]
  let statusClause = ""
  if (opts?.status) {
    params.push(opts.status)
    statusClause = `AND o.status = $${params.length}`
  }

  const { rows } = await query<{
    id: string
    market_id: string
    market_question: string
    market_slug: string
    side: "yes" | "no"
    avg_price: number
    shares: string
    cost_cents: string
    fee_cents: string
    status: "open" | "closed" | "void"
    realized_pnl: string | null
    market_status: string
    resolution: "yes" | "no" | "void" | null
    yes_price: number
    created_at: string
    closed_at: string | null
  }>(
    `SELECT o.id, o.market_id, m.question AS market_question, m.slug AS market_slug,
            o.side, o.avg_price, o.shares, o.cost_cents, o.fee_cents, o.status,
            o.realized_pnl, m.status AS market_status, m.resolution,
            m.yes_price, o.created_at, o.closed_at
     FROM orders o
     JOIN markets m ON m.id = o.market_id
     WHERE o.user_id = $1 ${statusClause}
     ORDER BY o.created_at DESC`,
    params,
  )

  return rows.map((r) => {
    const shares = Number(r.shares)
    const cost = Number(r.cost_cents)
    // Current price for this side in cents (0..100).
    const sidePriceCents = (r.side === "yes" ? r.yes_price : 10000 - r.yes_price) / 100
    let currentValue: number
    let pnl: number
    if (r.status === "closed" || r.realized_pnl != null) {
      // Realized: settled value = cost + realized pnl.
      pnl = Number(r.realized_pnl ?? 0)
      currentValue = cost + pnl
    } else {
      // Mark-to-market: shares * current price per share (shares are in 1/100 units).
      currentValue = Math.round(shares * sidePriceCents)
      pnl = currentValue - cost
    }
    return {
      id: r.id,
      market_id: r.market_id,
      market_question: r.market_question,
      market_slug: r.market_slug,
      outcome: r.side,
      avg_price: r.avg_price / 100,
      shares,
      cost_cents: cost,
      current_value_cents: currentValue,
      pnl_cents: pnl,
      status: r.status === "void" ? "closed" : r.status,
      market_status: r.market_status as BetRow["market_status"],
      resolved_outcome: r.resolution === "void" ? null : r.resolution,
      created_at: r.created_at,
      updated_at: r.closed_at ?? r.created_at,
    }
  })
}

export interface PortfolioSummary {
  open_positions: number
  position_value_cents: number
  total_cost_cents: number
  unrealized_pnl_cents: number
  realized_pnl_cents: number
}

export async function getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
  const bets = await getUserBets(userId)
  let positionValue = 0
  let totalCost = 0
  let unrealized = 0
  let realized = 0
  let open = 0
  for (const b of bets) {
    if (b.status === "open") {
      open += 1
      positionValue += b.current_value_cents
      totalCost += b.cost_cents
      unrealized += b.pnl_cents
    } else {
      realized += b.pnl_cents
    }
  }
  return {
    open_positions: open,
    position_value_cents: positionValue,
    total_cost_cents: totalCost,
    unrealized_pnl_cents: unrealized,
    realized_pnl_cents: realized,
  }
}

export async function getUserTransactions(
  userId: string,
  limit = 100,
): Promise<TransactionRow[]> {
  const { rows } = await query<{
    id: string
    type: string
    status: string
    amount_cents: string
    balance_after_cents: string | null
    description: string | null
    reference: string | null
    created_at: string
  }>(
    `SELECT id, type, status, amount_cents, balance_after_cents, description, reference, created_at
     FROM transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit],
  )
  return rows.map((r) => ({
    id: r.id,
    type: r.type as TransactionRow["type"],
    status: r.status as TransactionRow["status"],
    amount_cents: Number(r.amount_cents),
    balance_after_cents: Number(r.balance_after_cents ?? 0),
    description: r.description,
    reference: r.reference,
    created_at: r.created_at,
  }))
}
