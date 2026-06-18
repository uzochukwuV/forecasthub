// Shared formatting helpers used across marketing + app surfaces.

export function formatUsd(
  cents: number,
  opts: { compact?: boolean; sign?: boolean } = {},
): string {
  const dollars = cents / 100
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: opts.compact ? "compact" : "standard",
    maximumFractionDigits: opts.compact ? 1 : 2,
  })
  const out = formatter.format(Math.abs(dollars))
  if (opts.sign) return `${dollars < 0 ? "-" : "+"}${out}`
  return dollars < 0 ? `-${out}` : out
}

// Probabilities/prices are stored as basis points (0-10000) = 0.00%-100.00%.
export function formatProbability(bps: number): string {
  return `${(bps / 100).toFixed(0)}%`
}

export function formatPriceCents(bps: number): string {
  // A YES share that settles at $1.00 trades at price = probability.
  return `${(bps / 100).toFixed(0)}¢`
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
