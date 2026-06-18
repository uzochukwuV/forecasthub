"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatUsd } from "@/lib/format"
import { withdrawAction } from "@/app/(app)/wallet/actions"
import { toast } from "sonner"

export function WithdrawPanel({ availableCents }: { availableCents: number }) {
  const router = useRouter()
  const [amount, setAmount] = useState("")
  const [pending, startTransition] = useTransition()
  const amountCents = Math.round((Number.parseFloat(amount) || 0) * 100)
  const tooMuch = amountCents > availableCents

  function submit() {
    if (amountCents < 500) {
      toast.error("Minimum withdrawal is $5.00")
      return
    }
    if (tooMuch) {
      toast.error("Amount exceeds available balance")
      return
    }
    startTransition(async () => {
      const res = await withdrawAction(amountCents)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success("Withdrawal requested. Funds are on the way.")
      setAmount("")
      router.refresh()
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Withdraw funds
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Transfer available funds back to your bank. Available {formatUsd(availableCents)}.
      </p>

      <div className="mt-4 space-y-2">
        <Label htmlFor="withdraw-amount">Amount</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="withdraw-amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-7 font-mono"
          />
        </div>
        <button
          type="button"
          onClick={() => setAmount((availableCents / 100).toFixed(2))}
          className="text-xs text-primary hover:underline"
        >
          Withdraw max
        </button>
      </div>

      <Button
        onClick={submit}
        disabled={pending || availableCents === 0}
        variant="outline"
        className="mt-4 w-full"
        size="lg"
      >
        {pending ? "Processing…" : "Request withdrawal"}
      </Button>
    </div>
  )
}
