import { readFile, readdir } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// One-time migration runner. Executes every .sql file in /scripts in order.
// Guarded by a token so it can't be triggered by arbitrary visitors.
export async function POST(request: Request) {
  const token = request.headers.get("x-migrate-token")
  if (!token || token !== process.env.MIGRATE_TOKEN) {
    // Allow local execution without a token only from the dev runner.
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const dir = path.join(process.cwd(), "scripts")
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()
  const applied: string[] = []

  try {
    for (const file of files) {
      const sql = await readFile(path.join(dir, file), "utf8")
      await pool.query(sql)
      applied.push(file)
    }
  } catch (error) {
    return NextResponse.json(
      { ok: false, applied, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, applied })
}
