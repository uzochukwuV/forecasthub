"use client"

import { useEffect, useRef, useState } from "react"
import type { Market } from "@/lib/types"

export interface PriceSnapshot {
  id: string
  yes_price: number
  no_price: number
  volume_cents: number
}

export interface LiveState {
  prices: Record<string, PriceSnapshot>
  // direction of last change per market: 1 up, -1 down, 0 flat
  direction: Record<string, number>
  connected: boolean
}

/**
 * Subscribes to the SSE price stream and tracks the latest price per market,
 * plus the direction of the most recent change (for up/down flash styling).
 */
export function useLiveMarkets(initial: Market[]): LiveState {
  const [prices, setPrices] = useState<Record<string, PriceSnapshot>>(() =>
    Object.fromEntries(
      initial.map((m) => [
        m.id,
        { id: m.id, yes_price: m.yes_price, no_price: m.no_price, volume_cents: m.volume_cents },
      ]),
    ),
  )
  const [direction, setDirection] = useState<Record<string, number>>({})
  const [connected, setConnected] = useState(false)
  const prevRef = useRef<Record<string, number>>({})

  useEffect(() => {
    const es = new EventSource("/api/markets/stream")
    es.addEventListener("ready", () => setConnected(true))
    es.addEventListener("prices", (e) => {
      const snapshots = JSON.parse((e as MessageEvent).data) as PriceSnapshot[]
      setPrices((prev) => {
        const next = { ...prev }
        const dir: Record<string, number> = {}
        for (const s of snapshots) {
          const before = prevRef.current[s.id]
          if (before !== undefined && before !== s.yes_price) {
            dir[s.id] = s.yes_price > before ? 1 : -1
          }
          prevRef.current[s.id] = s.yes_price
          next[s.id] = s
        }
        if (Object.keys(dir).length) {
          setDirection((d) => ({ ...d, ...dir }))
        }
        return next
      })
    })
    es.onerror = () => setConnected(false)
    return () => es.close()
  }, [])

  return { prices, direction, connected }
}
