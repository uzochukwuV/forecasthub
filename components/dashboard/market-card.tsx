"use client"

import Link from "next/link"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatUsd, formatProbabilityCents } from "@/lib/format"
import type { Market } from "@/lib/types"

interface MarketCardProps {
  market: Market
  // Optional live YES price in cents (0..100) pushed from the realtime stream.
  livePriceCents?: number
}

export function MarketCard({ market, livePriceCents }: MarketCardProps) {
  const yes = livePriceCents ?? market.yes_price
  // Live delta vs. the server-rendered baseline price.
  const deltaCents = livePriceCents != null ? livePriceCents - market.yes_price : 0
  const up = deltaCents >= 0

  return (
    <Link href={`/markets/${market.slug}`} className="group block">
      <Card className="relative overflow-hidden p-5 transition-colors group-hover:border-primary/60">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {market.category_name ? (
              <Badge variant="outline" className="mb-2 text-xs">
                {market.category_name}
              </Badge>
            ) : null}
            <h3 className="text-pretty font-medium leading-snug text-foreground line-clamp-2">
              {market.question}
            </h3>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-md px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
              market.status === "open"
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {market.status}
          </span>
        </div>

        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="font-mono text-3xl font-semibold tabular-nums text-foreground">
              {formatProbabilityCents(yes)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">YES probability</p>
          </div>
          {deltaCents !== 0 ? (
            <div
              className={cn(
                "flex items-center gap-1 font-mono text-sm tabular-nums",
                up ? "text-primary" : "text-destructive",
              )}
            >
              {up ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
              {up ? "+" : ""}
              {deltaCents.toFixed(1)}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span>Vol {formatUsd(market.volume_cents)}</span>
          <span>OI {formatUsd(market.open_interest_cents)}</span>
        </div>
      </Card>
    </Link>
  )
}
