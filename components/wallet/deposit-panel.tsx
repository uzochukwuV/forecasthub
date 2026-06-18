"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatUsd } from "@/lib/format"
import { startDepositAction } from "@/app/(app)/wallet/actions"
import { toast } from "sonner"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string)
const PRESETS = [2500, 5000, 10000, 25000]

export function DepositPanel() {
  const router = useRouter()
  const [amount, setAmount] = useState("50.00")
  const [open, setOpen] = useState(false)
  const amountCents = Math.round((Number.parseFloat(amount) || 0) * 100)

  const fetchClientSecret = useCallback(async () => {
    const res = await startDepositAction(amountCents)
    if (res?.error || !res?.clientSecret) {
      throw new Error(res?.error ?? "Failed to start deposit")
    }
    return res.clientSecret
  }, [amountCents])

  function openCheckout() {
    if (amountCents < 500) {
      toast.error("Minimum deposit is $5.00")
      return
    }
    if (amountCents > 2_500_000) {
      toast.error("Maximum deposit is $25,000.00")
      return
    }
    setOpen(true)
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

      <Button onClick={openCheckout} className="mt-4 w-full" size="lg">
        {`Deposit ${formatUsd(amountCents)}`}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete your deposit</DialogTitle>
          </DialogHeader>
          {open ? (
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          ) : null}
          <p className="mt-2 text-center text-xs text-muted-foreground">
            After payment, your balance updates automatically. You can close this window.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false)
              router.refresh()
            }}
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
