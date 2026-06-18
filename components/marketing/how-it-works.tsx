const steps = [
  {
    n: "01",
    title: "Fund your account",
    body: "Deposit via Stripe in seconds. Balances are held in a segregated, fully-ledgered account.",
  },
  {
    n: "02",
    title: "Take a position",
    body: "Buy YES or NO shares on any open market. Prices move in real time with the crowd's belief.",
  },
  {
    n: "03",
    title: "Settle & withdraw",
    body: "When a market resolves, winning shares pay $1.00 each. Cash out to your bank anytime.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="max-w-2xl">
        <p className="eyebrow text-primary">How it works</p>
        <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          From conviction to position in three steps
        </h2>
      </div>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="relative flex flex-col gap-3 border-t border-border pt-6">
            <span className="font-mono text-sm text-primary">{s.n}</span>
            <h3 className="font-heading text-xl font-semibold">{s.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
