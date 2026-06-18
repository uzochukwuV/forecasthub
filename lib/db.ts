import { Pool, type PoolClient } from "pg"
import { Signer } from "@aws-sdk/rds-signer"
import { awsCredentialsProvider } from "@vercel/functions/oidc"
import { attachDatabasePool } from "@vercel/functions"

const signer = new Signer({
  credentials: awsCredentialsProvider({
    roleArn: process.env.AWS_ROLE_ARN!,
    clientConfig: { region: process.env.AWS_REGION },
  }),
  region: process.env.AWS_REGION,
  hostname: process.env.PGHOST!,
  username: process.env.PGUSER || "postgres",
  port: 5432,
})

declare global {
  // eslint-disable-next-line no-var
  var __forecastHubPool: Pool | undefined
}

function createPool() {
  const pool = new Pool({
    host: process.env.PGHOST,
    database: process.env.PGDATABASE || "postgres",
    port: 5432,
    user: process.env.PGUSER || "postgres",
    password: () => signer.getAuthToken(),
    ssl: { rejectUnauthorized: false },
    max: 20,
  })
  attachDatabasePool(pool)
  return pool
}

export const pool = global.__forecastHubPool ?? createPool()
if (process.env.NODE_ENV !== "production") global.__forecastHubPool = pool

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<{ rows: T[]; rowCount: number }> {
  const res = await pool.query(text, params)
  return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 }
}

// Run a function inside a SERIALIZABLE transaction. Used for all money movement.
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
  isolation: "SERIALIZABLE" | "REPEATABLE READ" | "READ COMMITTED" = "SERIALIZABLE",
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query(`BEGIN ISOLATION LEVEL ${isolation}`)
    const result = await fn(client)
    await client.query("COMMIT")
    return result
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}
