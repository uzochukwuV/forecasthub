"use server"

import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { z } from "zod"
import { authenticate, createSession, destroySession, registerUser } from "@/lib/auth"

const signupSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  displayName: z.string().min(2, "Name must be at least 2 characters.").max(60),
})

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
})

export type AuthState = { error?: string } | undefined

async function sessionMeta() {
  const h = await headers()
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
    ua: h.get("user-agent") ?? undefined,
  }
}

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }

  const result = await registerUser(parsed.data)
  if ("error" in result) return { error: result.error }

  await createSession(result.id, await sessionMeta())
  redirect("/dashboard")
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }

  const userId = await authenticate(parsed.data.email, parsed.data.password)
  if (!userId) return { error: "Invalid email or password." }

  await createSession(userId, await sessionMeta())
  redirect("/dashboard")
}

export async function logoutAction() {
  await destroySession()
  redirect("/")
}
