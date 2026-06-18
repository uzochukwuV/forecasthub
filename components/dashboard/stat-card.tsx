import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  sub?: string
  icon: LucideIcon
  accent?: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Icon className={cn("size-4", accent ? "text-primary" : "text-muted-foreground")} />
      </div>
      <p
        className={cn(
          "mt-3 font-mono text-2xl font-semibold tabular-nums",
          accent ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}
