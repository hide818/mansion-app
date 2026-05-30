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
    setOpenMap((prev) => ({
      ...prev,
      [label]: !prev[label],
    }))
  }

  return (
    <aside className="sticky top-0 h-screen w-full max-w-[320px] border-r border-slate-200 bg-slate-950 text-slate-100">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-800 px-5 py-5">
          <Link href="/dashboard" className="block">
            <p className="text-xs font-semibold tracking-[0.2em] text-emerald-400">
              MANSION SaaS
            </p>
            <h1 className="mt-2 text-2xl font-bold">マンション管理アプリ</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              引き継ぎ、事務処理、案件・タスク管理に絞った実務アプリです。
            </p>
          </Link>
        </div>

        <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
          {menuGroups.map((group) => {
            const hasChildren = Boolean(group.children?.length)
            const isOpen = openMap[group.label]
            const isGroupDirectActive = group.href ? isChildActive(pathname, group.href) : false
            const featured = Boolean(group.featured)

            return (
              <section
                key={group.label}
                className={`rounded-2xl border ${
                  featured
                    ? 'border-emerald-500/60 bg-emerald-950/40'
                    : 'border-slate-800 bg-slate-900/80'
                }`}
              >
                <div className="flex items-center justify-between gap-2 px-4 py-4">
                  {group.href ? (
                    <Link
                      href={group.href}
                      className={`min-w-0 flex-1 ${
                        isGroupDirectActive ? 'text-white' : 'text-slate-100'
                      }`}
                    >
                      <p className={`text-sm font-semibold ${featured ? 'text-emerald-300' : 'text-slate-100'}`}>
                        {group.label}
                      </p>
                      {group.summary ? (
                        <p className={`mt-1 text-xs leading-5 ${featured ? 'text-emerald-500' : 'text-slate-400'}`}>
                          {group.summary}
                        </p>
                      ) : null}
                    </Link>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${featured ? 'text-emerald-300' : 'text-slate-100'}`}>
                        {group.label}
                      </p>
                      {group.summary ? (
                        <p className={`mt-1 text-xs leading-5 ${featured ? 'text-emerald-500' : 'text-slate-400'}`}>
                          {group.summary}
                        </p>
                      ) : null}
                    </div>
                  )}

                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.label)}
                      className={`rounded-lg border px-2 py-1 text-xs hover:bg-slate-800 ${
                        featured
                          ? 'border-emerald-600 text-emerald-300'
                          : 'border-slate-700 text-slate-300'
                      }`}
                    >
                      {isOpen ? '閉じる' : '開く'}
                    </button>
                  ) : null}
                </div>

                {hasChildren && isOpen ? (
                  <div className={`space-y-2 border-t px-3 py-3 ${featured ? 'border-emerald-800/60' : 'border-slate-800'}`}>
                    {group.children?.map((child) => {
                      const active = isChildActive(pathname, child.href)

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`block rounded-xl border px-3 py-3 transition ${
                            active
                              ? 'border-emerald-500 bg-emerald-500/10 text-white'
                              : featured
                                ? 'border-emerald-800/40 bg-emerald-950/60 text-emerald-100 hover:border-emerald-600 hover:bg-emerald-900/50'
                                : 'border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <p className="text-sm font-medium">{child.label}</p>
                          {child.description ? (
                            <p className={`mt-1 text-xs leading-5 ${featured && !active ? 'text-emerald-400/80' : 'text-slate-400'}`}>
                              {child.description}
                            </p>
                          ) : null}
                        </Link>
                      )
                    })}
                  </div>
                ) : null}
              </section>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
