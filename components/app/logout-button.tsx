import { LogOut } from "lucide-react"
import { logoutAction } from "@/app/(auth)/actions"
import { buttonVariants } from "@/components/ui/button"

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className={buttonVariants({ variant: "outline" })}>
        <LogOut className="size-4" />
        Sign out
      </button>
    </form>
  )
}
