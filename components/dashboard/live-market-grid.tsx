"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { useLiveMarkets } from "@/hooks/use-live-markets"
import { MarketCard } from "./market-card"
import type { Market, Category } from "@/lib/types"

interface LiveMarketGridProps {
  markets: Market[]
  categories: Category[]
}

export function LiveMarketGrid({ markets, categories }: LiveMarketGridProps) {
  const [active, setActive] = useState("all")
  const { prices, connected } = useLiveMarkets(markets)

  const filtered = useMemo(() => {
    if (active === "all") return markets
    return markets.filter((m) => {
      const cat = categories.find((c) => c.id === m.category_id)
      return cat?.slug === active
    })
  }, [active, markets, categories])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              "size-2 rounded-full",
              connected ? "bg-primary animate-pulse" : "bg-muted-foreground/50",
            )}
            aria-hidden
          />
          {connected ? "Live" : "Connecting…"}
        </div>
        <button
          onClick={() => setActive("all")}
          className={cn(
            "rounded-full border px-3 py-1 text-sm transition-colors",
            active === "all"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c.slug)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              active === c.slug
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No markets in this category yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <MarketCard key={m.id} market={m} livePriceCents={prices[m.id]?.yes_price} />
          ))}
        </div>
      )}
    </section>
  )
}
