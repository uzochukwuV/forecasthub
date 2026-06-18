import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const display = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})
const mono = JetBrains_Mono({
  variable: '--font-mono-jb',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'ForecastHub — Institutional-Grade Prediction Markets',
  description:
    'Trade the outcome of real-world events. A high-frequency forecasting and intelligence platform with live markets, deep liquidity, and instant settlement.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark bg-background ${display.variable} ${inter.variable} ${mono.variable}`}
    >
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
