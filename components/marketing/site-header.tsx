import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Logo } from "@/components/brand/logo"

const navLinks = [
  { label: "Markets", href: "/markets" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Institutional", href: "#institutional" },
  { label: "Docs", href: "#docs" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="ForecastHub home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={buttonVariants({ variant: "ghost", className: "hidden sm:inline-flex" })}
          >
            Sign in
          </Link>
          <Link href="/signup" className={buttonVariants()}>
            Open account
          </Link>
        </div>
      </div>
    </header>
  )
}
