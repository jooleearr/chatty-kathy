import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Chatty Kathy - AI Chatbot',
  description: 'AI chatbot with multi-source integration',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
