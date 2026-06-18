import { Wallet, TrendingUp, Layers, Activity } from "lucide-react"
import { requireUser } from "@/lib/auth"
import { getBalances } from "@/lib/accounting"
import { getMarkets, getCategories, getMarketStats } from "@/lib/markets"
import { getPortfolioSummary } from "@/lib/portfolio"
import { formatUsd } from "@/lib/format"
import { StatCard } from "@/components/dashboard/stat-card"
import { LiveMarketGrid } from "@/components/dashboard/live-market-grid"

export default async function DashboardPage() {
  const user = await requireUser()
  const [balances, portfolio, markets, categories, stats] = await Promise.all([
    getBalances(user.id),
    getPortfolioSummary(user.id),
    getMarkets(),
    getCategories(),
    getMarketStats(),
  ])

  const pnl = portfolio.unrealized_pnl_cents
  const pnlPct =
    portfolio.total_cost_cents > 0
      ? ((pnl / portfolio.total_cost_cents) * 100).toFixed(1)
      : "0.0"

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back, {user.display_name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live prices update in real time as the market trades.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Available cash"
          value={formatUsd(balances.available_cents)}
          sub="Ready to trade"
          icon={Wallet}
          accent
        />
        <StatCard
          label="Position value"
          value={formatUsd(portfolio.position_value_cents)}
          sub={`${portfolio.open_positions} open positions`}
          icon={Layers}
        />
        <StatCard
          label="Unrealized P&L"
          value={formatUsd(pnl, { sign: true })}
          sub={`${pnl >= 0 ? "+" : ""}${pnlPct}% on cost`}
          icon={TrendingUp}
        />
        <StatCard
          label="Platform volume"
          value={formatUsd(stats.total_volume_cents, { compact: true })}
          sub={`${stats.open_markets} open markets`}
          icon={Activity}
        />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-medium text-foreground">Markets</h2>
        <LiveMarketGrid markets={markets} categories={categories} />
      </div>
    </div>
  )
}
