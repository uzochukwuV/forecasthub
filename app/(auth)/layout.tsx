import type React from "react"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth"

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (user) redirect("/dashboard")

  return (
    <main className="grid min-h-svh place-items-center px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(60% 50% at 50% 0%, color-mix(in oklch, var(--primary) 14%, transparent), transparent)",
        }}
      />
      {children}
    </main>
  )
}
