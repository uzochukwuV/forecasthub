export type UserRole = "user" | "admin"
export type UserStatus = "active" | "suspended" | "closed"
export type KycStatus = "none" | "pending" | "verified" | "rejected"

export interface User {
  id: string
  email: string
  display_name: string
  role: UserRole
  status: UserStatus
  kyc_status: KycStatus
  created_at: string
}

export interface SessionUser {
  id: string
  email: string
  display_name: string
  role: UserRole
}

export type MarketStatus = "open" | "closed" | "resolved" | "void"
export type Outcome = "yes" | "no"

export interface Category {
  id: number
  slug: string
  name: string
}

export interface Market {
  id: string
  slug: string
  question: string
  description: string | null
  category_id: number | null
  category_name?: string
  status: MarketStatus
  // probability of YES, 0..1 (derived from yes_price in cents / 100)
  yes_price: number
  no_price: number
  volume_cents: number
  liquidity_cents: number
  open_interest_cents: number
  closes_at: string | null
  resolved_outcome: Outcome | null
  created_at: string
}

export type PositionStatus = "open" | "closed"

export interface BetRow {
  id: string
  market_id: string
  market_question: string
  market_slug: string
  outcome: Outcome
  // average entry price in cents (0..100)
  avg_price: number
  shares: number
  cost_cents: number
  // realized + unrealized
  current_value_cents: number
  pnl_cents: number
  status: PositionStatus
  market_status: MarketStatus
  resolved_outcome: Outcome | null
  created_at: string
  updated_at: string
}

export type TxnType =
  | "deposit"
  | "withdrawal"
  | "trade_buy"
  | "trade_sell"
  | "settlement"
  | "fee"
  | "adjustment"
export type TxnStatus = "pending" | "completed" | "failed" | "canceled"

export interface TransactionRow {
  id: string
  type: TxnType
  status: TxnStatus
  amount_cents: number
  balance_after_cents: number
  description: string | null
  reference: string | null
  created_at: string
}

export interface AccountBalance {
  available_cents: number
  reserved_cents: number
  total_cents: number
}
