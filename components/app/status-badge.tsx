import { cn } from "@/lib/utils"

type Variant = "open" | "closed" | "won" | "lost" | "pending" | "completed" | "failed" | "neutral"

const STYLES: Record<Variant, string> = {
  open: "border-primary/40 bg-primary/10 text-primary",
  won: "border-primary/40 bg-primary/10 text-primary",
  completed: "border-primary/40 bg-primary/10 text-primary",
  closed: "border-border bg-muted text-muted-foreground",
  neutral: "border-border bg-muted text-muted-foreground",
  pending: "border-amber-500/40 bg-amber-500/10 text-amber-500",
  lost: "border-destructive/40 bg-destructive/10 text-destructive",
  failed: "border-destructive/40 bg-destructive/10 text-destructive",
}

export function StatusBadge({ status, label }: { status: Variant; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider",
        STYLES[status],
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "open" || status === "won" || status === "completed"
            ? "bg-primary"
            : status === "pending"
              ? "bg-amber-500"
              : status === "lost" || status === "failed"
                ? "bg-destructive"
                : "bg-muted-foreground",
        )}
      />
      {label ?? status}
    </span>
  )
}
