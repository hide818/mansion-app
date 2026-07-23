'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'
import GlobalSearch from './GlobalSearch'

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

  // ── デスクトップ用フライアウト state ────────────────────────────
  // hoveredLabel / hoverY : マウスオーバー中のグループ（離れたらクリア）
  // pinnedLabel / pinnedY : クリック固定中のグループ（クリックするまで維持）
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null)
  const [hoverY, setHoverY] = useState(0)
  const [pinnedLabel, setPinnedLabel] = useState<string | null>(null)
  const [pinnedY, setPinnedY] = useState(0)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // scheduleClose は hoveredLabel だけをクリア。pinnedLabel は維持する。
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
    setHoverY(rect.top)
    setHoveredLabel(label)
  }

  function handleGroupClick(label: string, el: HTMLButtonElement) {
    if (pinnedLabel === label) {
      // 同じグループを再クリック → 固定解除
      setPinnedLabel(null)
      setPinnedY(0)
    } else {
      // 別グループ or 未固定 → 固定
      const rect = el.getBoundingClientRect()
      setPinnedLabel(label)
      setPinnedY(rect.top)
    }
  }

  // フライアウトに表示する内容と位置
  // ホバーが優先。ホバーが外れたら固定グループに戻る。
  const displayLabel = hoveredLabel ?? pinnedLabel
  const displayY = hoveredLabel !== null ? hoverY : pinnedY
  const activeGroup = menuGroups.find((g) => g.label === displayLabel) ?? null
  const flyoutVisible = Boolean(displayLabel && activeGroup?.children?.length)

  function handleFlyoutLinkClick() {
    setHoveredLabel(null)
    setPinnedLabel(null)
    setPinnedY(0)
  }

  return (
    <>
      {/* ── サイドバー本体 ── */}
      <div className="flex h-full w-full flex-col">
        {/* ブランドヘッダー */}
        <div className="relative flex-none overflow-hidden bg-[#1e3a5f] px-5 pb-4 pt-5">
          {/* トップアクセントライン */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600" />
          {/* 背景グロー */}
          <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full bg-blue-400/15 blur-2xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-full bg-cyan-400/10 blur-xl" />

          <Link href="/dashboard" className="relative block">
            <span className="inline-block rounded-full border border-blue-400/30 bg-blue-500/20 px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.25em] text-blue-300">
              管理会社専用 AI
            </span>
            <h1 className="mt-1.5 bg-gradient-to-br from-white via-blue-50 to-blue-200 bg-clip-text text-[34px] font-black leading-none tracking-tight text-transparent">
              Kura
            </h1>
            <div className="mt-2.5 h-px w-full bg-gradient-to-r from-blue-400/50 via-cyan-400/30 to-transparent" />
          </Link>
          <div className="mt-3">
            <GlobalSearch />
          </div>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 overflow-y-auto py-2">
          {menuGroups.map((group) => {
            const hasChildren = Boolean(group.children?.length)
            const isOpen = openMap[group.label]
            const isHovered = hoveredLabel === group.label
            const isPinned = pinnedLabel === group.label

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
                  onClick={(e) => {
                    if (!hasChildren) return
                    toggleGroup(group.label)          // モバイルアコーディオン
                    handleGroupClick(group.label, e.currentTarget) // デスクトップ固定
                  }}
                  className={`flex min-h-10 w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors duration-100 ${
                    isPinned
                      ? 'bg-slate-100'
                      : isHovered
                      ? 'bg-slate-50'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`text-[15px] font-medium transition-colors duration-100 ${
                      isPinned || isHovered ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {group.label}
                  </span>

                  {/* 固定中インジケーター（デスクトップのみ） */}
                  {isPinned && (
                    <span className="hidden text-[10px] text-slate-400 lg:block">›</span>
                  )}

                  {/* アコーディオン矢印（モバイルのみ） */}
                  {hasChildren && !isPinned && (
                    <span className="text-[9px] text-slate-300 lg:hidden">
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

      {/* ── デスクトップ用フライアウト（lg以上で表示） ── */}
      {/*
        position: fixed で親の overflow-y-auto に影響されず viewport 基準で配置。
        transition-opacity のみ使用することで、pinnedY → hoverY 間のポジション
        変化がアニメーションせず自然に切り替わる。
      */}
      <div
        style={{
          top: displayY,
          left: SIDEBAR_WIDTH,
          maxHeight: `calc(100vh - ${displayY}px - 12px)`,
        }}
        className={`fixed z-50 hidden w-56 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl transition-opacity duration-150 ease-out lg:block ${
          flyoutVisible
            ? 'opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        {/* 固定中はグループ名をヘッダーとして表示 */}
        {pinnedLabel && pinnedLabel === displayLabel && (
          <div className="border-b border-slate-100 px-4 py-1.5">
            <span className="text-[11px] font-semibold text-slate-400">{pinnedLabel}</span>
          </div>
        )}

        {activeGroup?.children?.map((child) => {
          const active = isChildActive(pathname, child.href)
          return (
            <Link
              key={child.href}
              href={child.href}
              onClick={handleFlyoutLinkClick}
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
