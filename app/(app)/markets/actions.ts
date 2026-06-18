"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireUser } from "@/lib/auth"
import { executeBuy } from "@/lib/trading"

const tradeSchema = z.object({
  marketId: z.string().uuid(),
  side: z.enum(["yes", "no"]),
  amountDollars: z.coerce.number().positive().max(100000),
})

export type TradeState = { error?: string; success?: string } | undefined

export async function placeTradeAction(
  _prev: TradeState,
  formData: FormData,
): Promise<TradeState> {
  const user = await requireUser()
  const parsed = tradeSchema.safeParse({
    marketId: formData.get("marketId"),
    side: formData.get("side"),
    amountDollars: formData.get("amountDollars"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid trade." }
  }

  try {
    const result = await executeBuy({
      userId: user.id,
      marketId: parsed.data.marketId,
      side: parsed.data.side,
      amountCents: Math.round(parsed.data.amountDollars * 100),
    })
    revalidatePath("/dashboard")
    revalidatePath("/positions")
    revalidatePath("/transactions")
    revalidatePath(`/markets`)
    const shareUnits = (result.shares / 100).toFixed(2)
    return { success: `Filled ${shareUnits} ${parsed.data.side.toUpperCase()} shares.` }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Trade failed." }
  }
}
