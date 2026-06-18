import { requireUser, getFullUser } from "@/lib/auth"
import { getBalances } from "@/lib/accounting"
import { getPortfolioSummary } from "@/lib/portfolio"
import { StatusBadge } from "@/components/app/status-badge"
import { formatUsd, formatDate } from "@/lib/format"
import { LogoutButton } from "@/components/app/logout-button"

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

export default async function AccountPage() {
  const session = await requireUser()
  const [user, balances, portfolio] = await Promise.all([
    getFullUser(session.id),
    getBalances(session.id),
    getPortfolioSummary(session.id),
  ])
  if (!user) return null

  const kycVariant =
    user.kyc_status === "verified"
      ? "completed"
      : user.kyc_status === "pending"
        ? "pending"
        : user.kyc_status === "rejected"
          ? "failed"
          : "neutral"

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6">
        <h1 className="font-sans text-2xl font-semibold">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, verification, and balances.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Profile
          </h2>
          <Field label="Name" value={user.display_name} />
          <Field label="Email" value={user.email} />
          <Field
            label="Account status"
            value={<StatusBadge status="completed" label={user.status} />}
          />
          <Field
            label="Verification"
            value={<StatusBadge status={kycVariant} label={user.kyc_status} />}
          />
          <Field label="Member since" value={formatDate(user.created_at)} />
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Balances
          </h2>
          <Field label="Available" value={<span className="font-mono">{formatUsd(balances.available_cents)}</span>} />
          <Field label="In open positions" value={<span className="font-mono">{formatUsd(balances.reserved_cents)}</span>} />
          <Field label="Total equity" value={<span className="font-mono font-semibold">{formatUsd(balances.total_cents)}</span>} />
          <Field
            label="Open positions"
            value={<span className="font-mono">{portfolio.open_positions}</span>}
          />
          <Field
            label="Realized P&L"
            value={
              <span className="font-mono">{formatUsd(portfolio.realized_pnl_cents, { sign: true })}</span>
            }
          />
        </section>

        <section className="rounded-lg border border-border bg-card p-5 md:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Security
          </h2>
          <p className="text-sm text-muted-foreground">
            Your password is hashed with Argon2id. Sessions are stored server-side and expire
            automatically. Sign out below to revoke this session.
          </p>
          <div className="mt-4">
            <LogoutButton />
          </div>
        </section>
      </div>
    </div>
  )
}
