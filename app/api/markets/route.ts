import { NextResponse } from "next/server"
import { getMarkets } from "@/lib/markets"
import type { MarketStatus } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category") ?? undefined
  const status = (searchParams.get("status") as MarketStatus | null) ?? undefined
  const markets = await getMarkets({ categorySlug: category, status: status ?? undefined })
  return NextResponse.json({ markets })
}
