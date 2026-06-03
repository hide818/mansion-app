'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'

export type NavChild = {
  label: string
  href: string
  description?: string
}

export type NavGroup = {
  label: string
  href?: string
  summary?: string
  featured?: boolean
  children?: NavChild[]
}

type SidebarClientProps = {
  menuGroups: NavGroup[]
}

function isChildActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function SidebarClient({ menuGroups }: SidebarClientProps) {
  const pathname = usePathname()

  const initialOpenMap = useMemo(() => {
    const map: Record<string, boolean> = {}
    for (const group of menuGroups) {
      const hasActiveChild = group.children?.some((child) =>
        isChildActive(pathname, child.href),
      )
      map[group.label] = Boolean(hasActiveChild)
    }
    return map
  }, [menuGroups, pathname])

  const [openMap, setOpenMap] = useState<Record<string, boolean>>(initialOpenMap)

  function toggleGroup(label: string) {
    setOpenMap((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* ブランドヘッダー */}
      <div className="flex-none bg-[#1e3a5f] px-4 py-4">
        <Link href="/dashboard" className="block">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-300">
            MANSION SaaS
          </p>
          <h1 className="mt-1 text-[14px] font-bold leading-snug text-white">
            マンション管理アプリ
          </h1>
        </Link>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 overflow-y-auto py-2">
        {menuGroups.map((group) => {
          const hasChildren = Boolean(group.children?.length)
          const isOpen = openMap[group.label]

          return (
            <div key={group.label} className="mt-1">
              <button
                type="button"
                onClick={() => hasChildren && toggleGroup(group.label)}
                className="flex w-full items-center justify-between px-3 py-1.5 text-left"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {group.label}
                </span>
                {hasChildren && (
                  <span className="text-[9px] text-gray-400">
                    {isOpen ? '▲' : '▼'}
                  </span>
                )}
              </button>

              {hasChildren && isOpen && (
                <div className="mb-1">
                  {group.children?.map((child) => {
                    const active = isChildActive(pathname, child.href)
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center border-l-2 px-4 py-2 text-[13px] leading-snug transition-colors ${
                          active
                            ? 'border-blue-600 bg-blue-50 font-semibold text-blue-700'
                            : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                        }`}
                      >
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}
