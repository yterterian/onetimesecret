import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OneTimeSecret - Share Secrets Securely',
  description: 'Keep sensitive information out of your email and chat logs. Share a secret link that automatically expires.',
  keywords: ['secret', 'password', 'secure', 'sharing', 'encryption', 'one-time'],
  openGraph: {
    title: 'OneTimeSecret - Share Secrets Securely',
    description: 'Keep sensitive information out of your email and chat logs.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
