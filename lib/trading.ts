import "server-only"
import { withTransaction } from "@/lib/db"
import {
  postEntry,
  getUserAccountIds,
  getSystemAccountId,
} from "@/lib/accounting"

export interface TradeInput {
  userId: string
  marketId: string
  side: "yes" | "no"
  // dollar amount the user wants to spend, in cents
  amountCents: number
}

export interface TradeResult {
  orderId: string
  shares: number
  priceCents: number
  feeCents: number
}

const FEE_BPS = 100 // 1% trading fee
const MIN_TRADE_CENTS = 100 // $1 minimum

/**
 * Executes a market buy: locks cash into escrow, mints shares at the current
 * price, books a 1% fee to the house, and nudges the market price (simple
 * constant-impact model based on trade size vs. liquidity).
 * Everything happens in a single DB transaction over the double-entry ledger.
 */
export async function executeBuy(input: TradeInput): Promise<TradeResult> {
  if (input.amountCents < MIN_TRADE_CENTS) {
    throw new Error("Minimum trade is $1.00")
  }

  return withTransaction(async (client) => {
    // Lock the market row to serialize price updates.
    const marketRes = await client.query<{
      id: string
      status: string
      yes_price: number
      liquidity_param: string
      yes_shares: string
      no_shares: string
      volume_cents: string
      open_interest: string
    }>(
      `SELECT id, status, yes_price, liquidity_param, yes_shares, no_shares,
              volume_cents, open_interest
       FROM markets WHERE id = $1 FOR UPDATE`,
      [input.marketId],
    )
    const market = marketRes.rows[0]
    if (!market) throw new Error("Market not found")
    if (market.status !== "open") throw new Error("Market is not open for trading")

    const yesPriceBps = market.yes_price
    const sidePriceBps = input.side === "yes" ? yesPriceBps : 10000 - yesPriceBps
    if (sidePriceBps <= 0 || sidePriceBps >= 10000) {
      throw new Error("Market price is out of tradable range")
    }

    // Fee taken off the top; remainder buys shares.
    const feeCents = Math.floor((input.amountCents * FEE_BPS) / 10000)
    const investCents = input.amountCents - feeCents
    // Shares are denominated in 1/100 units so a $1.00 settlement = 100 cents.
    // shares = invest / price_per_share; price_per_share = sidePriceBps/10000 dollars.
    const priceCentsPerShare = sidePriceBps / 100 // cents (0..100)
    const shares = Math.floor((investCents / priceCentsPerShare) * 100)
    if (shares <= 0) throw new Error("Trade too small for current price")

    // --- Ledger: debit user cash, credit escrow (locked stake) + house fees ---
    const { cash, escrow } = await getUserAccountIds(client, input.userId)
    const houseFees = await getSystemAccountId(client, "house_fees")

    // Ensure sufficient available balance.
    const balRes = await client.query<{ balance: string }>(
      `SELECT balance FROM account_balances WHERE account_id = $1 FOR UPDATE`,
      [cash],
    )
    const available = Number(balRes.rows[0]?.balance ?? 0)
    if (available < input.amountCents) {
      throw new Error("Insufficient available balance")
    }

    // Create the order first so we can reference it from the ledger entry.
    const orderRes = await client.query<{ id: string }>(
      `INSERT INTO orders (user_id, market_id, side, action, shares, avg_price, cost_cents, fee_cents, status)
       VALUES ($1, $2, $3, 'buy', $4, $5, $6, $7, 'open')
       RETURNING id`,
      [input.userId, input.marketId, input.side, shares, sidePriceBps, input.amountCents, feeCents],
    )
    const orderId = orderRes.rows[0].id

    const entryId = await postEntry(client, {
      kind: "trade",
      referenceId: orderId,
      memo: `Buy ${input.side.toUpperCase()} shares`,
      legs: [
        { accountId: cash, amount: -input.amountCents },
        { accountId: escrow, amount: investCents },
        { accountId: houseFees, amount: feeCents },
      ],
    })
    await client.query(`UPDATE orders SET ledger_entry_id = $1 WHERE id = $2`, [entryId, orderId])

    // --- Upsert net position ---
    await client.query(
      `INSERT INTO positions (user_id, market_id, side, shares, avg_cost)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, market_id, side)
       DO UPDATE SET
         avg_cost = ((positions.shares * positions.avg_cost) + (EXCLUDED.shares * EXCLUDED.avg_cost))
                    / NULLIF(positions.shares + EXCLUDED.shares, 0),
         shares = positions.shares + EXCLUDED.shares,
         updated_at = now()`,
      [input.userId, input.marketId, input.side, shares, sidePriceBps],
    )

    // --- Price impact: shift YES price toward the side being bought ---
    const liquidity = Number(market.liquidity_param)
    const impactBps = Math.min(
      300,
      Math.round((investCents / Math.max(liquidity, 1)) * 10000),
    )
    let newYesBps = yesPriceBps
    if (input.side === "yes") newYesBps = Math.min(9900, yesPriceBps + impactBps)
    else newYesBps = Math.max(100, yesPriceBps - impactBps)

    await client.query(
      `UPDATE markets
       SET yes_price = $1,
           volume_cents = volume_cents + $2,
           open_interest = open_interest + $3,
           yes_shares = yes_shares + $4,
           no_shares = no_shares + $5,
           updated_at = now()
       WHERE id = $6`,
      [
        newYesBps,
        input.amountCents,
        investCents,
        input.side === "yes" ? shares : 0,
        input.side === "no" ? shares : 0,
        input.marketId,
      ],
    )

    // Record a price tick for charts / realtime.
    await client.query(
      `INSERT INTO price_ticks (market_id, yes_price, volume_cents) VALUES ($1, $2, $3)`,
      [input.marketId, newYesBps, input.amountCents],
    )

    return { orderId, shares, priceCents: priceCentsPerShare, feeCents }
  })
}
