import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"

export function Cta() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-16 sm:px-12 lg:py-24">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full opacity-25 blur-[100px]"
          style={{ background: "radial-gradient(circle, #7fee64 0%, transparent 70%)" }}
          aria-hidden
        />
        <Image
          src="/cube-cluster.png"
          alt=""
          aria-hidden
          width={360}
          height={360}
          className="pointer-events-none absolute -bottom-10 right-0 hidden h-auto w-72 select-none opacity-80 lg:block"
        />
        <div className="relative max-w-xl">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
            Your edge deserves a market.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
            Open an account in minutes and start trading the world&apos;s most important questions.
          </p>
          <Link href="/signup" className={buttonVariants({ size: "lg", className: "mt-8" })}>
            Get started
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
