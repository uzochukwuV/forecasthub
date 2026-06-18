import "server-only"
import { query } from "@/lib/db"
import type { Market, Category, MarketStatus, Outcome } from "@/lib/types"

interface MarketRow {
  id: string
  slug: string
  question: string
  description: string | null
  category_id: number | null
  category_name: string | null
  status: MarketStatus
  yes_price: number // bps
  volume_cents: string
  liquidity_param: string
  open_interest: string
  closes_at: string | null
  resolution: Outcome | null
  created_at: string
}

function mapMarket(r: MarketRow): Market {
  const yesCents = r.yes_price / 100 // bps -> cents (0..100)
  return {
    id: r.id,
    slug: r.slug,
    question: r.question,
    description: r.description,
    category_id: r.category_id,
    category_name: r.category_name ?? undefined,
    status: r.status,
    yes_price: yesCents,
    no_price: 100 - yesCents,
    volume_cents: Number(r.volume_cents),
    liquidity_cents: Number(r.liquidity_param),
    open_interest_cents: Number(r.open_interest),
    closes_at: r.closes_at,
    resolved_outcome: r.resolution,
    created_at: r.created_at,
  }
}

const SELECT_MARKET = `
  SELECT m.id, m.slug, m.question, m.description, m.category_id, c.name AS category_name,
         m.status, m.yes_price, m.volume_cents, m.liquidity_param, m.open_interest,
         m.closes_at, m.resolution, m.created_at
  FROM markets m
  LEFT JOIN categories c ON c.id = m.category_id`

export async function getMarkets(opts?: { categorySlug?: string; status?: MarketStatus }): Promise<Market[]> {
  const clauses: string[] = ["m.status <> 'draft'"]
  const params: unknown[] = []
  if (opts?.status) {
    params.push(opts.status)
    clauses.push(`m.status = $${params.length}`)
  }
  if (opts?.categorySlug && opts.categorySlug !== "all") {
    params.push(opts.categorySlug)
    clauses.push(`c.slug = $${params.length}`)
  }
  const { rows } = await query<MarketRow>(
    `${SELECT_MARKET} WHERE ${clauses.join(" AND ")} ORDER BY m.volume_cents DESC`,
    params,
  )
  return rows.map(mapMarket)
}

export async function getMarketBySlug(slug: string): Promise<Market | null> {
  const { rows } = await query<MarketRow>(`${SELECT_MARKET} WHERE m.slug = $1`, [slug])
  return rows[0] ? mapMarket(rows[0]) : null
}

export async function getCategories(): Promise<Category[]> {
  const { rows } = await query<Category>(`SELECT id, slug, name FROM categories ORDER BY sort, name`)
  return rows
}

export interface PricePoint {
  t: string
  yes: number // cents 0..100
}

export async function getPriceHistory(marketId: string, limit = 48): Promise<PricePoint[]> {
  const { rows } = await query<{ created_at: string; yes_price: number }>(
    `SELECT created_at, yes_price FROM price_ticks
     WHERE market_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [marketId, limit],
  )
  return rows
    .map((r) => ({ t: r.created_at, yes: r.yes_price / 100 }))
    .reverse()
}

export interface MarketStats {
  total_volume_cents: number
  open_markets: number
  total_open_interest_cents: number
}

export async function getMarketStats(): Promise<MarketStats> {
  const { rows } = await query<{ vol: string; cnt: string; oi: string }>(
    `SELECT COALESCE(SUM(volume_cents),0) AS vol,
            COUNT(*) FILTER (WHERE status='open') AS cnt,
            COALESCE(SUM(open_interest),0) AS oi
     FROM markets WHERE status <> 'draft'`,
  )
  return {
    total_volume_cents: Number(rows[0]?.vol ?? 0),
    open_markets: Number(rows[0]?.cnt ?? 0),
    total_open_interest_cents: Number(rows[0]?.oi ?? 0),
  }
}
