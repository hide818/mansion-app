import './globals.css'
import type { Metadata, Viewport } from 'next'
import Sidebar from './components/Sidebar'
import LayoutShell from './LayoutShell'

export const metadata: Metadata = {
  title: 'Kura — 管理会社専用AI',
  description: '担当者が辞めても止まらない管理会社を実現するAI SaaS',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kura',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="overflow-x-hidden bg-gray-50 text-slate-900 antialiased">
        <LayoutShell
          sidebar={
            <aside className="relative z-30 hidden w-[220px] shrink-0 border-r border-gray-200 bg-white lg:block">
              <div className="sticky top-0 h-screen overflow-y-auto">
                <Sidebar />
              </div>
            </aside>
          }
        >
          {children}
        </LayoutShell>
      </body>
    </html>
  )
}
