'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  sidebar: ReactNode
}

export default function LayoutShell({ children, sidebar }: Props) {
  const pathname = usePathname()

  if (pathname === '/login') {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      {sidebar}
      <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
    </div>
  )
}