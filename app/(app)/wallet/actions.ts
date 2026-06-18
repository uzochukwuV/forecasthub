"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { requireUser } from "@/lib/auth"
import { createDepositSession, requestWithdrawal, confirmDepositBySession } from "@/lib/payments"

export async function startDepositAction(amountCents: number) {
  const user = await requireUser()
  try {
    const h = await headers()
    const host = h.get("x-forwarded-host") ?? h.get("host")
    const proto = h.get("x-forwarded-proto") ?? "https"
    const origin = host ? `${proto}://${host}` : "http://localhost:3000"
    const { url } = await createDepositSession(user.id, Math.round(amountCents), origin)
    if (!url) return { error: "Could not start deposit" }
    return { url }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not start deposit" }
  }
}

export async function confirmDepositAction(sessionId: string) {
  const user = await requireUser()
  try {
    const result = await confirmDepositBySession(user.id, sessionId)
    revalidatePath("/wallet")
    revalidatePath("/dashboard")
    return { ok: true, credited: result.credited }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not confirm deposit" }
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
