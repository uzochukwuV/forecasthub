import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { getUserBets } from "@/lib/portfolio"
import { BetsTable } from "@/components/bets/bets-table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default async function BetsPage() {
  const user = await requireUser()
  const [all, open, closed] = await Promise.all([
    getUserBets(user.id),
    getUserBets(user.id, { status: "open" }),
    getUserBets(user.id, { status: "closed" }),
  ])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="font-sans text-2xl font-semibold">Bets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every position you&apos;ve taken, with live mark-to-market valuation and status.
        </p>
      </header>

      {all.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">You haven&apos;t placed any bets yet.</p>
          <Link
            href="/markets"
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            Browse markets →
          </Link>
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({all.length})</TabsTrigger>
            <TabsTrigger value="open">Open ({open.length})</TabsTrigger>
            <TabsTrigger value="closed">Closed ({closed.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <BetsTable bets={all} />
          </TabsContent>
          <TabsContent value="open" className="mt-4">
            <BetsTable bets={open} />
          </TabsContent>
          <TabsContent value="closed" className="mt-4">
            <BetsTable bets={closed} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
