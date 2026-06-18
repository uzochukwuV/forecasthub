"use client"

import { useActionState } from "react"
import Link from "next/link"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/brand/logo"
import { loginAction, signupAction, type AuthState } from "@/app/(auth)/actions"

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? "Please wait..." : label}
    </Button>
  )
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? loginAction : signupAction
  const [state, formAction] = useActionState<AuthState, FormData>(action, undefined)

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <Link href="/">
          <Logo />
        </Link>
        <div>
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground">
            {mode === "login" ? "Sign in to your account" : "Open your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Access your markets, positions, and balance."
              : "Start trading on the outcomes that matter."}
          </p>
        </div>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        {mode === "signup" && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="displayName">Full name</Label>
            <Input id="displayName" name="displayName" autoComplete="name" required placeholder="Jane Doe" />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@firm.com" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            placeholder="••••••••"
          />
        </div>

        {state?.error && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}

        <SubmitButton label={mode === "login" ? "Sign in" : "Create account"} />
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
              Open an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  )
}
