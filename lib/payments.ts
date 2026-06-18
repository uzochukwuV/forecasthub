import "server-only"
import { query, withTransaction } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { postEntry, getUserAccountIds, getSystemAccountId, getBalances } from "@/lib/accounting"
import type { PoolClient } from "pg"

const MIN_DEPOSIT_CENTS = 500 // $5
const MAX_DEPOSIT_CENTS = 2_500_000 // $25,000
const MIN_WITHDRAW_CENTS = 500

export interface PaymentRow {
  id: string
  direction: "deposit" | "withdrawal"
  amount_cents: number
  status: string
  created_at: string
}

/**
 * Creates a pending deposit record and a Stripe embedded Checkout session.
 * Funds are only credited to the ledger when the webhook confirms payment.
 */
export async function createDepositSession(userId: string, amountCents: number) {
  if (!Number.isInteger(amountCents)) throw new Error("Invalid amount")
  if (amountCents < MIN_DEPOSIT_CENTS) throw new Error("Minimum deposit is $5.00")
  if (amountCents > MAX_DEPOSIT_CENTS) throw new Error("Maximum deposit is $25,000.00")

  const paymentRes = await query<{ id: string }>(
    `INSERT INTO payments (user_id, direction, amount_cents, status)
     VALUES ($1, 'deposit', $2, 'pending') RETURNING id`,
    [userId, amountCents],
  )
  const paymentId = paymentRes.rows[0].id

  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "ForecastHub account deposit",
            description: "Funds added to your trading balance",
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: { paymentId, userId, kind: "wallet_deposit" },
    payment_intent_data: { metadata: { paymentId, userId } },
  })

  await query(`UPDATE payments SET stripe_session_id = $1 WHERE id = $2`, [session.id, paymentId])
  return session.client_secret
}

/**
 * Idempotently credits a confirmed deposit. Called from the Stripe webhook.
 * Uses webhook_events for exactly-once processing and the payments unique
 * session index to avoid double-crediting.
 */
export async function creditDeposit(params: {
  eventId: string
  eventType: string
  sessionId: string
  paymentIntentId: string | null
  amountReceivedCents: number
}) {
  await withTransaction(async (client: PoolClient) => {
    // Exactly-once: skip if we've already processed this event.
    const evt = await client.query(
      `INSERT INTO webhook_events (id, type) VALUES ($1, $2)
       ON CONFLICT (id) DO NOTHING RETURNING id`,
      [params.eventId, params.eventType],
    )
    if (evt.rowCount === 0) return

    // Lock the payment row.
    const payRes = await client.query<{
      id: string
      user_id: string
      amount_cents: string
      status: string
    }>(
      `SELECT id, user_id, amount_cents, status FROM payments
       WHERE stripe_session_id = $1 FOR UPDATE`,
      [params.sessionId],
    )
    const payment = payRes.rows[0]
    if (!payment) return
    if (payment.status === "succeeded") return // already credited

    const amount = Number(payment.amount_cents)
    const { cash } = await getUserAccountIds(client, payment.user_id)
    const stripeAcct = await getSystemAccountId(client, "external_stripe")

    const entryId = await postEntry(client, {
      kind: "deposit",
      referenceId: payment.id,
      idempotencyKey: `deposit:${payment.id}`,
      memo: "Stripe deposit",
      legs: [
        { accountId: stripeAcct, amount: -amount },
        { accountId: cash, amount: amount },
      ],
    })

    await client.query(
      `UPDATE payments
       SET status = 'succeeded', stripe_payment_intent = $1, ledger_entry_id = $2, updated_at = now()
       WHERE id = $3`,
      [params.paymentIntentId, entryId, payment.id],
    )

    await client.query(
      `INSERT INTO audit_log (user_id, action, detail)
       VALUES ($1, 'deposit_succeeded', $2)`,
      [payment.user_id, JSON.stringify({ paymentId: payment.id, amount })],
    )
  })
}

/**
 * Withdrawal request: validates available balance and moves funds from the
 * user's cash account to house clearing as a pending payout. In production a
 * back-office job would execute the Stripe payout and flip status to succeeded.
 */
export async function requestWithdrawal(userId: string, amountCents: number) {
  if (!Number.isInteger(amountCents)) throw new Error("Invalid amount")
  if (amountCents < MIN_WITHDRAW_CENTS) throw new Error("Minimum withdrawal is $5.00")

  return withTransaction(async (client: PoolClient) => {
    const { cash } = await getUserAccountIds(client, userId)
    const clearing = await getSystemAccountId(client, "house_clearing")

    const balRes = await client.query<{ balance: string }>(
      `SELECT balance FROM account_balances WHERE account_id = $1 FOR UPDATE`,
      [cash],
    )
    const available = Number(balRes.rows[0]?.balance ?? 0)
    if (available < amountCents) throw new Error("Insufficient available balance")

    const payRes = await client.query<{ id: string }>(
      `INSERT INTO payments (user_id, direction, amount_cents, status)
       VALUES ($1, 'withdrawal', $2, 'processing') RETURNING id`,
      [userId, amountCents],
    )
    const paymentId = payRes.rows[0].id

    const entryId = await postEntry(client, {
      kind: "withdrawal",
      referenceId: paymentId,
      idempotencyKey: `withdrawal:${paymentId}`,
      memo: "Withdrawal to bank",
      legs: [
        { accountId: cash, amount: -amountCents },
        { accountId: clearing, amount: amountCents },
      ],
    })

    await client.query(`UPDATE payments SET ledger_entry_id = $1 WHERE id = $2`, [
      entryId,
      paymentId,
    ])
    await client.query(
      `INSERT INTO audit_log (user_id, action, detail)
       VALUES ($1, 'withdrawal_requested', $2)`,
      [userId, JSON.stringify({ paymentId, amount: amountCents })],
    )

    return { paymentId }
  })
}

export async function getRecentPayments(userId: string, limit = 20): Promise<PaymentRow[]> {
  const { rows } = await query<{
    id: string
    direction: "deposit" | "withdrawal"
    amount_cents: string
    status: string
    created_at: string
  }>(
    `SELECT id, direction, amount_cents, status, created_at
     FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit],
  )
  return rows.map((r) => ({
    id: r.id,
    direction: r.direction,
    amount_cents: Number(r.amount_cents),
    status: r.status,
    created_at: r.created_at,
  }))
}

export { getBalances }
