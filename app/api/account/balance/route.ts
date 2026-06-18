import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { getBalances } from "@/lib/accounting"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const balances = await getBalances(user.id)
  return NextResponse.json(balances)
}
