"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { Category } from "@/lib/types"

export function CategoryTabs({
  categories,
  active,
}: {
  categories: Category[]
  active: string
}) {
  const tabs = [{ id: 0, slug: "all", name: "All" }, ...categories]
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Market categories">
      {tabs.map((c) => {
        const isActive = active === c.slug
        return (
          <Link
            key={c.slug}
            href={c.slug === "all" ? "/markets" : `/markets?category=${c.slug}`}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            {c.name}
          </Link>
        )
      })}
    </nav>
  )
}
