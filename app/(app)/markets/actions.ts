"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireUser } from "@/lib/auth"
import { executeBuy } from "@/lib/trading"

const tradeSchema = z.object({
  marketId: z.string().uuid(),
  side: z.enum(["yes", "no"]),
  amountCents: z.number().int().positive().max(10_000_000),
})

export type TradeInput = z.infer<typeof tradeSchema>
export type TradeState = { error?: string; success?: string; shares?: number; side?: string } | undefined

export async function placeTradeAction(input: TradeInput): Promise<TradeState> {
  const user = await requireUser()
  const parsed = tradeSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid trade." }
  }

  try {
    const result = await executeBuy({
      userId: user.id,
      marketId: parsed.data.marketId,
      side: parsed.data.side,
      amountCents: parsed.data.amountCents,
    })
    revalidatePath("/dashboard")
    revalidatePath("/bets")
    revalidatePath("/transactions")
    revalidatePath("/markets")
    return {
      success: `Filled ${(result.shares / 100).toFixed(2)} ${parsed.data.side.toUpperCase()} shares.`,
      shares: result.shares,
      side: parsed.data.side,
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Trade failed." }
  }
}
