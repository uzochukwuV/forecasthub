import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="relative flex h-7 w-7 items-center justify-center rounded-md bg-primary">
        <span className="h-3 w-3 rounded-[3px] bg-primary-foreground" />
        <span className="absolute inset-0 rounded-md ring-1 ring-inset ring-primary/40" />
      </span>
      <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
        Forecast<span className="text-primary">Hub</span>
      </span>
    </div>
  )
}
