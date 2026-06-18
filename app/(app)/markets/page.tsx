import { getMarkets, getCategories } from "@/lib/markets"
import { LiveMarketGrid } from "@/components/dashboard/live-market-grid"

export const dynamic = "force-dynamic"

export default async function MarketsPage() {
  const [markets, categories] = await Promise.all([getMarkets(), getCategories()])

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground">Markets</h1>
        <p className="text-sm text-muted-foreground">
          Trade on the outcome of real-world events. Prices reflect the market-implied probability.
        </p>
      </header>

      {markets.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No markets available yet.
        </p>
      ) : (
        <LiveMarketGrid markets={markets} categories={categories} />
      )}
    </div>
  )
}
