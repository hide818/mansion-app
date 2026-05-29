import './globals.css'
import type { Metadata } from 'next'
import Sidebar from './components/Sidebar'

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
      <body className="overflow-x-hidden bg-slate-100 text-slate-900 antialiased">
        <div className="flex min-h-screen">
          <aside className="relative z-30 hidden w-[290px] shrink-0 border-r border-slate-200 bg-slate-50 lg:block">
            <div className="sticky top-0 h-screen overflow-visible">
              <Sidebar />
            </div>
          </aside>

          <main className="min-w-0 flex-1 overflow-x-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}