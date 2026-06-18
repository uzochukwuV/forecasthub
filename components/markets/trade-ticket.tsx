"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { formatUsd } from "@/lib/format"
import { placeTradeAction } from "@/app/(app)/markets/actions"
import { toast } from "sonner"

interface TradeTicketProps {
  marketId: string
  yesPriceBps: number
  availableCents: number
}

const QUICK = [1000, 2500, 5000, 10000]

export function TradeTicket({ marketId, yesPriceBps, availableCents }: TradeTicketProps) {
  const router = useRouter()
  const [side, setSide] = useState<"yes" | "no">("yes")
  const [amount, setAmount] = useState("25.00")
  const [pending, startTransition] = useTransition()

  const sidePriceBps = side === "yes" ? yesPriceBps : 10000 - yesPriceBps
  const priceCents = sidePriceBps / 100
  const amountCents = Math.round((Number.parseFloat(amount) || 0) * 100)
  const feeCents = Math.floor((amountCents * 100) / 10000)
  const investCents = amountCents - feeCents
  const estShares = priceCents > 0 ? Math.floor((investCents / priceCents) * 100) : 0
  const maxPayout = estShares // shares settle at 100c = $1.00 each / 100 units
  const insufficient = amountCents > availableCents

  function submit() {
    if (amountCents < 100) {
      toast.error("Minimum trade is $1.00")
      return
    }
    if (insufficient) {
      toast.error("Insufficient balance. Deposit funds first.")
      return
    }
    startTransition(async () => {
      const res = await placeTradeAction({ marketId, side, amountCents })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(`Filled ${(estShares / 100).toFixed(2)} ${side.toUpperCase()} shares`)
      router.refresh()
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setSide("yes")}
          className={cn(
            "rounded-md border px-4 py-3 text-sm font-medium transition-colors",
            side === "yes"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40",
          )}
        >
          <span className="block text-xs uppercase tracking-wider">Yes</span>
          <span className="font-mono text-lg">{(yesPriceBps / 100).toFixed(0)}¢</span>
        </button>
        <button
          type="button"
          onClick={() => setSide("no")}
          className={cn(
            "rounded-md border px-4 py-3 text-sm font-medium transition-colors",
            side === "no"
              ? "border-destructive bg-destructive/10 text-destructive"
              : "border-border text-muted-foreground hover:border-destructive/40",
          )}
        >
          <span className="block text-xs uppercase tracking-wider">No</span>
          <span className="font-mono text-lg">{((10000 - yesPriceBps) / 100).toFixed(0)}¢</span>
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="amount">Amount</Label>
          <span className="text-xs text-muted-foreground">
            Balance {formatUsd(availableCents)}
          </span>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-7 font-mono"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setAmount((q / 100).toFixed(2))}
              className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
            >
              {formatUsd(q)}
            </button>
          ))}
        </div>
      </div>

      <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Avg price</dt>
          <dd className="font-mono">{priceCents.toFixed(0)}¢</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Est. shares</dt>
          <dd className="font-mono">{(estShares / 100).toFixed(2)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Fee (1%)</dt>
          <dd className="font-mono">{formatUsd(feeCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Max payout</dt>
          <dd className="font-mono text-primary">{formatUsd(maxPayout)}</dd>
        </div>
      </dl>

      <Button
        onClick={submit}
        disabled={pending || insufficient}
        className="mt-4 w-full"
        size="lg"
      >
        {pending ? "Placing…" : insufficient ? "Insufficient balance" : `Buy ${side.toUpperCase()}`}
      </Button>
    </div>
  )
}
