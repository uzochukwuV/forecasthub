import { AuthForm } from "@/components/auth/auth-form"

export const metadata = { title: "Sign in — ForecastHub" }

export default function LoginPage() {
  return <AuthForm mode="login" />
}
