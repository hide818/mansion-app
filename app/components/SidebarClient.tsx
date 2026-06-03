'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'

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

const SIDEBAR_WIDTH = 220

export default function SidebarClient({ menuGroups }: SidebarClientProps) {
  const pathname = usePathname()

  // ── モバイル用アコーディオン state ──────────────────────────────
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

  // ── デスクトップ用ホバーフライアウト state ──────────────────────
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null)
  const [flyoutY, setFlyoutY] = useState(0)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setHoveredLabel(null), 150)
  }

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  function handleGroupEnter(label: string, el: HTMLDivElement) {
    cancelClose()
    const rect = el.getBoundingClientRect()
    setFlyoutY(rect.top)
    setHoveredLabel(label)
  }

  const activeGroup = menuGroups.find((g) => g.label === hoveredLabel) ?? null
  const flyoutVisible = Boolean(hoveredLabel && activeGroup?.children?.length)

  return (
    <>
      {/* ── サイドバー本体 ── */}
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
            const isHovered = hoveredLabel === group.label

            return (
              <div
                key={group.label}
                className="mt-1"
                onMouseEnter={(e) => {
                  if (hasChildren) handleGroupEnter(group.label, e.currentTarget)
                }}
                onMouseLeave={() => {
                  if (hasChildren) scheduleClose()
                }}
              >
                <button
                  type="button"
                  onClick={() => hasChildren && toggleGroup(group.label)}
                  className={`flex min-h-10 w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors duration-100 ${
                    isHovered ? 'bg-slate-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`text-[15px] font-medium uppercase tracking-wider transition-colors duration-100 ${
                      isHovered ? 'text-slate-700' : 'text-gray-400'
                    }`}
                  >
                    {group.label}
                  </span>
                  {/* アコーディオン矢印：デスクトップ(lg)では非表示 */}
                  {hasChildren && (
                    <span className="text-[9px] text-gray-400 lg:hidden">
                      {isOpen ? '▲' : '▼'}
                    </span>
                  )}
                </button>

                {/* モバイル用アコーディオン展開（lg以上では非表示） */}
                {hasChildren && isOpen && (
                  <div className="mb-1 lg:hidden">
                    {group.children?.map((child) => {
                      const active = isChildActive(pathname, child.href)
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center border-l-2 px-4 py-1.5 text-sm font-medium leading-snug transition-colors ${
                            active
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
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

      {/* ── デスクトップ用ホバーフライアウト（lg以上で表示） ── */}
      {/*
        position: fixed で親の overflow-y-auto に影響されず viewport 基準で配置。
        常に DOM にマウントし opacity/translate で show/hide することで
        exit アニメーションも自然に動作する。
      */}
      <div
        style={{
          top: flyoutY,
          left: SIDEBAR_WIDTH,
          maxHeight: `calc(100vh - ${flyoutY}px - 12px)`,
        }}
        className={`fixed z-50 hidden w-56 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl transition-all duration-150 ease-out lg:block ${
          flyoutVisible
            ? 'translate-x-0 opacity-100'
            : 'pointer-events-none translate-x-2 opacity-0'
        }`}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        {activeGroup?.children?.map((child) => {
          const active = isChildActive(pathname, child.href)
          return (
            <Link
              key={child.href}
              href={child.href}
              onClick={() => setHoveredLabel(null)}
              className={`flex min-h-9 w-full items-center whitespace-nowrap rounded-md border-l-2 px-4 py-1.5 text-sm font-medium leading-snug transition-colors ${
                active
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {child.label}
            </Link>
          )
        })}
      </div>
    </>
  )
}
