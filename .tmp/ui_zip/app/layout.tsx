import type { Metadata } from 'next'
import { Inter, Space_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PredictX — Prediction Markets on BNB',
  description: 'Trade real-world outcomes on the most liquid decentralized prediction market protocol. Powered by Polymarket data.',
  keywords: ['prediction market', 'BNB', 'DeFi', 'Polymarket', 'trading'],
  openGraph: {
    title: 'PredictX — Prediction Markets on BNB',
    description: 'Trade real-world outcomes on the most liquid decentralized prediction market protocol.',
    type: 'website',
  },
  themeColor: '#F0B90B',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable} dark`}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
