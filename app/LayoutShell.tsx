'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import type { ReactNode } from 'react'
import GlobalSearch from './components/GlobalSearch'

type Props = {
  children: ReactNode
  sidebar: ReactNode
}

const NO_SHELL_PATHS = ['/', '/login', '/signup', '/privacy', '/terms', '/security', '/lp']

function MobileTopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
      <Link href="/dashboard" className="flex items-center gap-1.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600">
          <span className="text-xs font-extrabold text-white">K</span>
        </div>
        <span className="text-sm font-bold text-slate-800">Kura</span>
      </Link>
      <div className="w-48">
        <GlobalSearch />
      </div>
    </header>
  )
}

function MobileBottomNav() {
  const pathname = usePathname()

  const items = [
    { href: '/dashboard', label: 'ホーム', icon: HomeIcon },
    { href: '/cases', label: '案件', icon: CasesIcon },
    { href: '/ai-minutes', label: 'AI議事録', icon: MinutesIcon },
    { href: '/handover-documents/new', label: '引き継ぎ', icon: HandoverIcon },
    { href: '/manager', label: '管理者', icon: ManagerIcon },
  ]

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white lg:hidden">
      <div className="flex h-16 items-stretch">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon active={active} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function CasesIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  )
}

function MinutesIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  )
}

function HandoverIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
    </svg>
  )
}

function ManagerIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

export default function LayoutShell({ children, sidebar }: Props) {
  const pathname = usePathname()

  if (NO_SHELL_PATHS.includes(pathname) || pathname.startsWith('/lp/')) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className="min-w-0 flex-1 overflow-x-hidden pb-16 lg:pb-0">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  )
}
