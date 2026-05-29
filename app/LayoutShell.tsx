'use client'

import { usePathname } from 'next/navigation'

type Props = {
  children: React.ReactNode
  sidebar: React.ReactNode | Promise<React.ReactNode>
}

export default function LayoutShell({ children, sidebar }: Props) {
  const pathname = usePathname()
  const hideSidebar = pathname === '/login'

  if (hideSidebar) {
    return <main className="min-h-screen">{children}</main>
  }

  return (
    <div className="flex min-h-screen">
      {sidebar as React.ReactNode}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}