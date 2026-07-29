'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function StickyCtaBar() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 600)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#d2d2d7]/60 bg-white/95 backdrop-blur-md px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <p className="hidden text-[14px] text-[#1d1d1f] sm:block">
          <span className="font-semibold">Kura</span> — 14日間無料トライアル実施中
          <span className="ml-3 text-[#6e6e73]">クレジットカード不要・いつでも解約</span>
        </p>
        <p className="text-[13px] text-[#1d1d1f] sm:hidden">14日間無料・クレジットカード不要</p>
        <Link
          href="/signup"
          className="shrink-0 rounded-full bg-[#0071e3] px-6 py-2.5 text-[14px] font-medium text-white hover:bg-[#0077ed] transition-colors"
        >
          無料で始める →
        </Link>
      </div>
    </div>
  )
}
