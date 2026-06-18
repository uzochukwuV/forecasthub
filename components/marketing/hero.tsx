import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Activity } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
        style={{ background: "radial-gradient(circle, #7fee64 0%, transparent 70%)" }}
        aria-hidden
      />
      <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-8 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="flex flex-col items-start">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="eyebrow text-muted-foreground">Markets live now</span>
          </div>
          <h1 className="mt-6 font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Trade the outcome of <span className="text-primary text-glow">everything</span>.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground text-pretty">
            An institutional-grade prediction exchange with deep liquidity, sub-second pricing, and
            instant settlement. Turn your conviction into a position.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Open account
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/markets" className={buttonVariants({ size: "lg", variant: "outline" })}>
              <Activity className="size-4" />
              Explore markets
            </Link>
          </div>
          <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-border pt-8">
            {[
              { label: "Total volume", value: "$2.4B" },
              { label: "Open markets", value: "1,280" },
              { label: "Avg. settlement", value: "<2s" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="eyebrow text-muted-foreground">{stat.label}</dt>
                <dd className="mt-1 font-heading text-2xl font-semibold tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative flex items-center justify-center">
          <Image
            src="/hero-cube.png"
            alt="Volumetric reactor-green glass cube representing the ForecastHub exchange core"
            width={620}
            height={620}
            priority
            className="h-auto w-full max-w-lg select-none"
          />
        </div>
      </div>
    </section>
  )
}
