import './globals.css'
import type { Metadata } from 'next'
import Sidebar from './components/Sidebar'
import LayoutShell from './LayoutShell'

export const metadata: Metadata = {
  title: 'マンション管理アプリ',
  description: 'マンション管理会社向けSaaS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
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