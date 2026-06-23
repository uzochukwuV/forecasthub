import { redirect } from "next/navigation"

// Legacy route — redirect to /bets
export default function PositionsPage() {
  redirect("/bets")
}
