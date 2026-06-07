import './globals.css'
import type { Metadata, Viewport } from 'next'
import Sidebar from './components/Sidebar'
import LayoutShell from './LayoutShell'
import { getUserProfile } from '@/lib/getUserProfile'

export const metadata: Metadata = {
  title: 'Kura — 管理会社専用AI',
  description: '担当者が辞めても止まらない管理会社を実現するAI SaaS。分譲マンション管理会社向け。',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kura',
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: 'Kura — 担当者が辞めても止まらない管理会社へ',
    description: '総会議事録が2時間→50分に。分譲マンション管理会社専用AI業務管理SaaS。',
    url: 'https://kura-management.com',
    siteName: 'Kura',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kura — 担当者が辞めても止まらない管理会社へ',
    description: '総会議事録が2時間→50分に。分譲マンション管理会社専用AI業務管理SaaS。',
  },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getUserProfile()
  const isAdmin = profile?.role === 'admin' || profile?.can_view_all_data === true

  return (
    <html lang="ja">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="overflow-x-hidden bg-gray-50 text-slate-900 antialiased">
        <LayoutShell
          isAdmin={isAdmin}
          sidebar={
            <aside className="relative z-30 hidden w-[220px] shrink-0 border-r border-gray-200 bg-white lg:block">
              <div className="sticky top-0 h-screen overflow-y-auto">
                <Sidebar isAdmin={isAdmin} />
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
