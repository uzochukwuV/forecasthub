"use client"

import Link from "next/link"
import useSWR from "swr"
import { LogOut, Plus } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatUsd } from "@/lib/format"
import { logoutAction } from "@/app/(auth)/actions"
import type { SessionUser, AccountBalance } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AppTopbar({ user }: { user: SessionUser }) {
  const { data } = useSWR<AccountBalance>("/api/account/balance", fetcher, {
    refreshInterval: 8000,
  })
  const initials = user.display_name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Link href="/dashboard" className="font-sans text-lg font-semibold text-foreground">
          Forecast<span className="text-primary">Hub</span>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <Link
          href="/wallet"
          className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5"
        >
          <span className="text-xs text-muted-foreground">Available</span>
          <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
            {data ? formatUsd(data.available_cents) : "—"}
          </span>
        </Link>
        <Link
          href="/wallet"
          className={buttonVariants({ variant: "outline", size: "sm", className: "hidden sm:inline-flex" })}
        >
          <Plus className="size-4" />
          Deposit
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Avatar className="size-9 border border-border">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{user.display_name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/account">Account settings</Link>} />
            <DropdownMenuItem render={<Link href="/transactions">Transaction history</Link>} />
            <DropdownMenuSeparator />
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground hover:bg-muted"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
