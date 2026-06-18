import { requireUser } from "@/lib/auth"
import { getUserTransactions } from "@/lib/portfolio"
import { getBalances } from "@/lib/accounting"
import { StatusBadge } from "@/components/app/status-badge"
import { formatUsd, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const TYPE_LABEL: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  trade_buy: "Trade — Buy",
  trade_sell: "Trade — Sell",
  settlement: "Settlement",
  fee: "Fee",
  adjustment: "Adjustment",
}

export default async function TransactionsPage() {
  const user = await requireUser()
  const [txns, balances] = await Promise.all([
    getUserTransactions(user.id),
    getBalances(user.id),
  ])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-sans text-2xl font-semibold">Transaction history</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A complete, immutable record derived from the double-entry ledger.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Available balance
          </div>
          <div className="font-mono text-2xl font-semibold">
            {formatUsd(balances.available_cents)}
          </div>
        </div>
      </header>

      {txns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          No transactions yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txns.map((t) => {
                const positive = t.amount_cents >= 0
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      {TYPE_LABEL[t.type] ?? t.type}
                    </TableCell>
                    <TableCell className="max-w-[320px] truncate text-muted-foreground">
                      {t.description ?? "—"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono",
                        positive ? "text-primary" : "text-foreground",
                      )}
                    >
                      {formatUsd(t.amount_cents, { sign: true })}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {formatUsd(t.balance_after_cents)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={
                          t.status === "completed"
                            ? "completed"
                            : t.status === "pending"
                              ? "pending"
                              : t.status === "failed"
                                ? "failed"
                                : "neutral"
                        }
                        label={t.status}
                      />
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatDate(t.created_at)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
