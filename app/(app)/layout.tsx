import type React from "react"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth"
import { AppSidebar } from "@/components/app/app-sidebar"
import { AppTopbar } from "@/components/app/app-topbar"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect("/login")

  return (
    <div className="flex min-h-svh">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar user={user} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  )
}
