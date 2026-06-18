import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { requireUser } from "@/lib/auth"
import { getMarketBySlug, getPriceHistory } from "@/lib/markets"
import { getBalances } from "@/lib/accounting"
import { PriceChart } from "@/components/markets/price-chart"
import { TradeTicket } from "@/components/markets/trade-ticket"
import { Badge } from "@/components/ui/badge"
import { formatUsd } from "@/lib/format"

export default async function MarketDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const user = await requireUser()
  const market = await getMarketBySlug(slug)
  if (!market) notFound()

  const [history, balances] = await Promise.all([
    getPriceHistory(market.id),
    getBalances(user.id),
  ])

  const yesCents = market.yes_price

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/markets"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All markets
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {market.category_name ? (
              <Badge variant="outline" className="uppercase tracking-wider">
                {market.category_name}
              </Badge>
            ) : null}
            <Badge
              variant={market.status === "open" ? "default" : "secondary"}
              className="uppercase tracking-wider"
            >
              {market.status}
            </Badge>
          </div>
          <h1 className="mt-3 text-balance font-sans text-2xl font-semibold leading-tight md:text-3xl">
            {market.question}
          </h1>
          {market.description ? (
            <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
              {market.description}
            </p>
          ) : null}

          <div className="mt-6 flex items-end gap-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Yes probability
              </div>
              <div className="font-mono text-4xl font-semibold text-primary">
                {yesCents.toFixed(0)}%
              </div>
            </div>
            <div className="pb-1">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Volume</div>
              <div className="font-mono text-lg">
                {formatUsd(market.volume_cents, { compact: true })}
              </div>
            </div>
            <div className="pb-1">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Open interest
              </div>
              <div className="font-mono text-lg">
                {formatUsd(market.open_interest_cents, { compact: true })}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-border bg-card p-4">
            <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
              Price history (YES ¢)
            </div>
            {history.length > 1 ? (
              <PriceChart data={history} />
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Not enough price history yet.
              </div>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          {market.status === "open" ? (
            <TradeTicket
              marketId={market.id}
              yesPriceBps={Math.round(yesCents * 100)}
              availableCents={balances.available_cents}
            />
          ) : (
            <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
              This market is {market.status}. Trading is closed.
              {market.resolved_outcome ? (
                <div className="mt-2 font-medium text-foreground">
                  Resolved: {market.resolved_outcome.toUpperCase()}
                </div>
              ) : null}
            </div>
          )}
          <p className="mt-3 px-1 text-xs leading-relaxed text-muted-foreground">
            Available balance {formatUsd(balances.available_cents)}. Funds are locked in escrow
            while positions are open and settled on resolution.
          </p>
        </aside>
      </div>
    </div>
  )
}
