"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatUsd } from "@/lib/format"
import { startDepositAction } from "@/app/(app)/wallet/actions"
import { toast } from "sonner"

const PRESETS = [2500, 5000, 10000, 25000]

export function DepositPanel() {
  const [amount, setAmount] = useState("50.00")
  const [pending, startTransition] = useTransition()
  const amountCents = Math.round((Number.parseFloat(amount) || 0) * 100)

  function startDeposit() {
    if (amountCents < 500) {
      toast.error("Minimum deposit is $5.00")
      return
    }
    if (amountCents > 2_500_000) {
      toast.error("Maximum deposit is $25,000.00")
      return
    }
    startTransition(async () => {
      const res = await startDepositAction(amountCents)
      if (res?.error || !res?.url) {
        toast.error(res?.error ?? "Could not start deposit")
        return
      }
      // Stripe's hosted checkout cannot be framed. The v0 preview runs inside an
      // iframe, so open in a new tab when framed; otherwise navigate the page.
      if (window.self !== window.top) {
        window.open(res.url, "_blank", "noopener,noreferrer")
      } else {
        window.location.href = res.url
      }
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Deposit funds
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Add money to your trading balance with a card via Stripe.
      </p>

      <div className="mt-4 space-y-2">
        <Label htmlFor="deposit-amount">Amount</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="deposit-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-7 font-mono"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAmount((p / 100).toFixed(2))}
              className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
            >
              {formatUsd(p)}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={startDeposit} disabled={pending} className="mt-4 w-full" size="lg">
        {pending ? "Redirecting to Stripe…" : `Deposit ${formatUsd(amountCents)}`}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        You&apos;ll be taken to Stripe&apos;s secure checkout. Test card: 4242 4242 4242 4242.
      </p>
    </div>
  )
}
