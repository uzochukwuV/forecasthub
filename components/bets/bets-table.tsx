import Link from "next/link"
import type { BetRow } from "@/lib/types"
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

export function BetsTable({ bets }: { bets: BetRow[] }) {
  if (bets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        No bets in this category.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead>Market</TableHead>
            <TableHead>Side</TableHead>
            <TableHead className="text-right">Entry</TableHead>
            <TableHead className="text-right">Shares</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead className="text-right">P&amp;L</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Placed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bets.map((b) => {
            const positive = b.pnl_cents >= 0
            const resolved = b.market_status === "resolved"
            const won = resolved && b.resolved_outcome === b.outcome
            const statusVariant = b.status === "open" ? "open" : won ? "won" : resolved ? "lost" : "closed"
            const statusLabel =
              b.status === "open" ? "Open" : resolved ? (won ? "Won" : "Lost") : "Closed"
            return (
              <TableRow key={b.id}>
                <TableCell className="max-w-[280px]">
                  <Link
                    href={`/markets/${b.market_slug}`}
                    className="line-clamp-2 font-medium hover:text-primary"
                  >
                    {b.market_question}
                  </Link>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-xs font-medium uppercase",
                      b.outcome === "yes"
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {b.outcome}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono">{b.avg_price.toFixed(0)}¢</TableCell>
                <TableCell className="text-right font-mono">
                  {(b.shares / 100).toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-mono">{formatUsd(b.cost_cents)}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatUsd(b.current_value_cents)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono",
                    positive ? "text-primary" : "text-destructive",
                  )}
                >
                  {formatUsd(b.pnl_cents, { sign: true })}
                </TableCell>
                <TableCell>
                  <StatusBadge status={statusVariant} label={statusLabel} />
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {formatDate(b.created_at)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
