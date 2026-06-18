"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"
import { createDepositSession, requestWithdrawal } from "@/lib/payments"

export async function startDepositAction(amountCents: number) {
  const user = await requireUser()
  try {
    const clientSecret = await createDepositSession(user.id, Math.round(amountCents))
    return { clientSecret }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not start deposit" }
  }
}

export async function withdrawAction(amountCents: number) {
  const user = await requireUser()
  try {
    await requestWithdrawal(user.id, Math.round(amountCents))
    revalidatePath("/wallet")
    revalidatePath("/dashboard")
    return { ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not process withdrawal" }
  }
}
