import { query } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Server-Sent Events stream of live market price snapshots.
// Pushes a snapshot immediately, then every INTERVAL ms until the client disconnects.
const INTERVAL_MS = 2500
const MAX_DURATION_MS = 1000 * 60 * 4 // cap a single connection; client reconnects automatically

interface Snapshot {
  id: string
  yes_price: number // cents 0..100
  no_price: number
  volume_cents: number
}

async function readSnapshots(): Promise<Snapshot[]> {
  const { rows } = await query<{ id: string; yes_price: number; volume_cents: string }>(
    `SELECT id, yes_price, volume_cents FROM markets WHERE status = 'open'`,
  )
  return rows.map((r) => ({
    id: r.id,
    yes_price: r.yes_price / 100,
    no_price: 100 - r.yes_price / 100,
    volume_cents: Number(r.volume_cents),
  }))
}

export async function GET(request: Request) {
  const encoder = new TextEncoder()
  let timer: ReturnType<typeof setInterval> | null = null
  let closed = false

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      const tick = async () => {
        try {
          send("prices", await readSnapshots())
        } catch {
          // swallow transient DB errors; next tick retries
        }
      }

      // Initial burst
      send("ready", { ts: Date.now(), interval: INTERVAL_MS })
      await tick()
      timer = setInterval(tick, INTERVAL_MS)

      const stop = () => {
        if (closed) return
        closed = true
        if (timer) clearInterval(timer)
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      }

      setTimeout(stop, MAX_DURATION_MS)
      request.signal.addEventListener("abort", stop)
    },
    cancel() {
      closed = true
      if (timer) clearInterval(timer)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
