import { requireUser } from "@/lib/auth"
import { getBalances } from "@/lib/accounting"
import { getRecentPayments, confirmDepositBySession } from "@/lib/payments"
import { DepositPanel } from "@/components/wallet/deposit-panel"
import { WithdrawPanel } from "@/components/wallet/withdraw-panel"
import { StatusBadge } from "@/components/app/status-badge"
import { formatUsd, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{ deposit?: string; session_id?: string }>
}) {
  const user = await requireUser()
  const sp = await searchParams

  // When Stripe redirects back after a successful deposit, credit the ledger.
  // confirmDepositBySession is idempotent, so refreshes can't double-credit.
  let banner: { ok: boolean; message: string } | null = null
  if (sp.deposit === "success" && sp.session_id) {
    try {
      await confirmDepositBySession(user.id, sp.session_id)
      banner = { ok: true, message: "Deposit received. Your balance has been updated." }
    } catch {
      banner = { ok: false, message: "We couldn't confirm that deposit. Contact support if charged." }
    }
  } else if (sp.deposit === "cancelled") {
    banner = { ok: false, message: "Deposit cancelled. No charge was made." }
  }

  const [balances, payments] = await Promise.all([
    getBalances(user.id),
    getRecentPayments(user.id),
  ])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="font-sans text-2xl font-semibold">Wallet</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Deposit and withdraw funds. All movements are recorded in the ledger.
        </p>
      </header>

      {banner ? (
        <div
          role="status"
          className={cn(
            "mb-6 rounded-lg border px-4 py-3 text-sm",
            banner.ok
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-destructive/40 bg-destructive/10 text-destructive",
          )}
        >
          {banner.message}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Available</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-primary">
            {formatUsd(balances.available_cents)}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">In positions</div>
          <div className="mt-1 font-mono text-2xl font-semibold">
            {formatUsd(balances.reserved_cents)}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Total equity</div>
          <div className="mt-1 font-mono text-2xl font-semibold">
            {formatUsd(balances.total_cents)}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <DepositPanel />
        <WithdrawPanel availableCents={balances.available_cents} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recent activity
        </h2>
        {payments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No deposits or withdrawals yet.
          </div>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border">
            {payments.map((p) => {
              const isDeposit = p.direction === "deposit"
              const variant =
                p.status === "succeeded"
                  ? "completed"
                  : p.status === "failed" || p.status === "canceled"
                    ? "failed"
                    : "pending"
              return (
                <div key={p.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium capitalize">{p.direction}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(p.created_at)}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={variant} label={p.status} />
                    <span
                      className={cn(
                        "font-mono font-semibold",
                        isDeposit ? "text-primary" : "text-foreground",
                      )}
                    >
                      {formatUsd(p.amount_cents, { sign: true }).replace("+", isDeposit ? "+" : "-")}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
