import { getMarkets, getCategories } from "@/lib/markets"
import { LiveMarketGrid } from "@/components/dashboard/live-market-grid"
import { CategoryTabs } from "@/components/markets/category-tabs"

export const dynamic = "force-dynamic"

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const [markets, categories] = await Promise.all([
    getMarkets({ categorySlug: category }),
    getCategories(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-mono text-2xl font-semibold tracking-tight text-foreground">Markets</h1>
        <p className="text-sm text-muted-foreground">
          Trade on the outcome of real-world events. Prices reflect the market-implied probability.
        </p>
      </header>

      <CategoryTabs categories={categories} active={category ?? "all"} />

      {markets.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No markets in this category yet.
        </p>
      ) : (
        <LiveMarketGrid initialMarkets={markets} />
      )}
    </div>
  )
}
