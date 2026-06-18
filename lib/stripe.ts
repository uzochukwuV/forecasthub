import "server-only"
import Stripe from "stripe"

let _stripe: Stripe | null = null

// Lazily instantiate so importing this module never throws at eval time
// (e.g. when a server component only needs payment history, not the client).
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured")
    _stripe = new Stripe(key)
  }
  return _stripe
}
