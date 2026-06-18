import "server-only"
import { cookies } from "next/headers"
import { randomBytes, createHash } from "node:crypto"
import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2"
import { query, withTransaction } from "@/lib/db"
import type { SessionUser, UserRole, User } from "@/lib/types"

const SESSION_COOKIE = "fh_session"
const SESSION_TTL_DAYS = 30

// Argon2id parameters tuned for server-side hashing.
const ARGON_OPTS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
}

export async function hashPassword(password: string): Promise<string> {
  return argonHash(password, ARGON_OPTS)
}

export async function verifyPassword(hashStr: string, password: string): Promise<boolean> {
  try {
    return await argonVerify(hashStr, password)
  } catch {
    return false
  }
}

// Store only a SHA-256 of the session token in the DB; the raw token lives in the cookie.
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export async function createSession(userId: string, meta?: { ip?: string; ua?: string }) {
  const token = randomBytes(32).toString("base64url")
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400 * 1000)

  await query(
    `INSERT INTO sessions (token_hash, user_id, ip, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [tokenHash, userId, meta?.ip ?? null, meta?.ua ?? null, expiresAt],
  )

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  })
}

export async function destroySession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    await query(`DELETE FROM sessions WHERE token_hash = $1`, [hashToken(token)])
    cookieStore.delete(SESSION_COOKIE)
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const { rows } = await query<{
    id: string
    email: string
    display_name: string
    role: UserRole
    status: string
  }>(
    `SELECT u.id, u.email, u.display_name, u.role, u.status
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [hashToken(token)],
  )

  const user = rows[0]
  if (!user || user.status !== "active") return null
  return { id: user.id, email: user.email, display_name: user.display_name, role: user.role }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) throw new Error("UNAUTHORIZED")
  return user
}

// Full user record (profile + KYC + status) for the account page.
export async function getFullUser(userId: string): Promise<User | null> {
  const { rows } = await query<User>(
    `SELECT id, email, display_name, role, status, kyc_status, created_at
     FROM users WHERE id = $1`,
    [userId],
  )
  return rows[0] ?? null
}

// Look up a user by email and verify the password. Returns the user id on success.
export async function authenticate(email: string, password: string): Promise<string | null> {
  const { rows } = await query<{ id: string; password_hash: string; status: string }>(
    `SELECT id, password_hash, status FROM users WHERE email_normalized = $1`,
    [email.toLowerCase().trim()],
  )
  const user = rows[0]
  if (!user || user.status !== "active") {
    // Run a dummy verify to reduce timing side channels.
    await argonHash("dummy-password", ARGON_OPTS).catch(() => {})
    return null
  }
  const ok = await verifyPassword(user.password_hash, password)
  return ok ? user.id : null
}

// Create a new user + their account/ledger row atomically.
export async function registerUser(input: {
  email: string
  password: string
  displayName: string
}): Promise<{ id: string } | { error: string }> {
  const email = input.email.trim()
  const emailNormalized = email.toLowerCase()
  const existing = await query(`SELECT 1 FROM users WHERE email_normalized = $1`, [emailNormalized])
  if (existing.rowCount > 0) return { error: "An account with that email already exists." }

  const passwordHash = await hashPassword(input.password)

  try {
    const id = await withTransaction(async (client) => {
      const userRes = await client.query(
        `INSERT INTO users (email, email_normalized, password_hash, display_name)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [email, emailNormalized, passwordHash, input.displayName.trim()],
      )
      const userId = userRes.rows[0].id
      // Each user gets a cash account (spendable) and an escrow account (reserved in open positions).
      const acctRes = await client.query(
        `INSERT INTO accounts (user_id, kind, currency)
         VALUES ($1, 'user_cash', 'USD'), ($1, 'user_escrow', 'USD')
         RETURNING id`,
        [userId],
      )
      // Initialize zero balances for both accounts.
      for (const row of acctRes.rows) {
        await client.query(
          `INSERT INTO account_balances (account_id, balance) VALUES ($1, 0)`,
          [row.id],
        )
      }
      return userId as string
    })
    return { id }
  } catch {
    return { error: "Could not create account. Please try again." }
  }
}
