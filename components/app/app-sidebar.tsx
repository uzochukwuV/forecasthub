"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, TrendingUp, Wallet, Receipt, Ticket, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/brand/logo"

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/markets", label: "Markets", icon: TrendingUp },
  { href: "/positions", label: "Positions", icon: Ticket },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/account", label: "Account", icon: User },
]

export function AppSidebar() {
  const pathname = usePathname()
  return (
    <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-border bg-card/40 px-4 py-5 md:flex">
      <Link href="/dashboard" className="mb-8 px-2">
        <Logo />
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <p className="px-3 text-xs text-muted-foreground">Markets settle in USD</p>
    </aside>
  )
}
