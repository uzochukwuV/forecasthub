import { SiteHeader } from "@/components/marketing/site-header"
import { Hero } from "@/components/marketing/hero"
import { MarketsPreview } from "@/components/marketing/markets-preview"
import { Features } from "@/components/marketing/features"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { Cta } from "@/components/marketing/cta"
import { SiteFooter } from "@/components/marketing/site-footer"

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <MarketsPreview />
        <Features />
        <HowItWorks />
        <Cta />
      </main>
      <SiteFooter />
    </div>
  )
}
