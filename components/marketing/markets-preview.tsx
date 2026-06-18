import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Card } from "@/components/ui/card"

const demoMarkets = [
  { q: "Fed cuts rates at next FOMC meeting?", cat: "Macro", yes: 68, vol: "$4.2M" },
  { q: "BTC above $150k by year end?", cat: "Crypto", yes: 41, vol: "$12.8M" },
  { q: "AI model beats 95% on ARC-AGI in 2026?", cat: "Tech", yes: 23, vol: "$1.9M" },
  { q: "Global temp record broken this year?", cat: "Climate", yes: 77, vol: "$830K" },
]

export function MarketsPreview() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-primary">Live order flow</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Real markets, real-time pricing
          </h2>
        </div>
        <Link
          href="/markets"
          className="hidden items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
        >
          View all markets
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {demoMarkets.map((m) => (
          <Card
            key={m.q}
            className="group flex flex-col justify-between gap-6 border-border bg-card p-5 transition-colors hover:border-primary/40"
          >
            <div className="flex flex-col gap-3">
              <span className="eyebrow w-fit rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                {m.cat}
              </span>
              <p className="text-sm font-medium leading-relaxed text-foreground text-pretty">{m.q}</p>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="font-heading text-2xl font-semibold tabular-nums text-primary">
                  {m.yes}%
                </span>
                <span className="font-mono text-xs text-muted-foreground">{m.vol} Vol</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${m.yes}%` }} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
