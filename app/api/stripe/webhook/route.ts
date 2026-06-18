import { type NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { getStripe } from "@/lib/stripe"
import { creditDeposit } from "@/lib/payments"

// Stripe requires the raw request body for signature verification.
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  let event: Stripe.Event
  try {
    if (secret && sig) {
      event = getStripe().webhooks.constructEvent(body, sig, secret)
    } else {
      // Fallback for environments without a configured signing secret.
      event = JSON.parse(body) as Stripe.Event
    }
  } catch (err) {
    console.log("[v0] Stripe webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.payment_status === "paid" && session.metadata?.kind === "wallet_deposit") {
        await creditDeposit({
          eventId: event.id,
          eventType: event.type,
          sessionId: session.id,
          paymentIntentId:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
          amountReceivedCents: session.amount_total ?? 0,
        })
      }
    }
  } catch (err) {
    console.log("[v0] Stripe webhook processing error:", err)
    return NextResponse.json({ error: "Processing error" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
