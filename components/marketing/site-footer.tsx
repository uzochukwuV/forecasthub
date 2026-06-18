import Link from "next/link"
import { Logo } from "@/components/brand/logo"

const columns = [
  { title: "Product", links: ["Markets", "Pricing", "API", "Status"] },
  { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
  { title: "Legal", links: ["Terms", "Privacy", "Disclosures", "Compliance"] },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[2fr_3fr] lg:px-8">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Institutional-grade prediction markets. Trading involves risk of loss and is intended for
            eligible participants only.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="eyebrow text-foreground">{col.title}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
          <p className="font-mono text-xs text-muted-foreground">
            © {new Date().getFullYear()} ForecastHub. All rights reserved.
          </p>
          <p className="font-mono text-xs text-muted-foreground">Markets close. Numbers don&apos;t.</p>
        </div>
      </div>
    </footer>
  )
}
