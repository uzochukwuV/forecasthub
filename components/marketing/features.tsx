import { Gauge, ShieldCheck, Layers, Zap, LineChart, Lock } from "lucide-react"

const features = [
  {
    icon: Gauge,
    title: "Sub-second pricing",
    body: "A managed real-time layer streams every price tick and fill to your dashboard the instant it happens.",
  },
  {
    icon: Layers,
    title: "Deep liquidity",
    body: "An automated market maker and resting limit orders keep spreads tight across thousands of markets.",
  },
  {
    icon: Zap,
    title: "Instant settlement",
    body: "Resolved markets settle to your balance in under two seconds — no waiting on manual payout cycles.",
  },
  {
    icon: ShieldCheck,
    title: "Segregated funds",
    body: "Customer balances are ledgered separately with double-entry accounting and full audit trails.",
  },
  {
    icon: LineChart,
    title: "Pro analytics",
    body: "Position-level P&L, exposure heatmaps, and historical resolution data for every market you touch.",
  },
  {
    icon: Lock,
    title: "Bank-grade security",
    body: "Hashed credentials, scoped sessions, parameterized queries, and PCI-compliant payments via Stripe.",
  },
]

export function Features() {
  return (
    <section id="institutional" className="border-y border-border bg-card/30">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow text-primary">Built for institutions</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Exchange infrastructure that takes accounting seriously
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
            Every cent is tracked on an immutable ledger. Every trade is atomic. Every session is
            scoped. This is the plumbing a serious forecasting venue requires.
          </p>
        </div>
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="flex flex-col gap-3 bg-card p-6">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="size-5" />
              </span>
              <h3 className="font-heading text-lg font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
