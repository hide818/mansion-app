'use client'

import Link from 'next/link'
import { useState } from 'react'

const NAV_LINKS = [
  { href: '/features', label: '機能' },
  { href: '#how', label: '使い方' },
  { href: '#pricing', label: '料金' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contact', label: 'お問い合わせ' },
  { href: '/blog', label: 'ブログ' },
  { href: '/login', label: 'ログイン' },
]

export default function LpMobileNav() {
  const [open, setOpen] = useState(false)
  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'メニューを閉じる' : 'メニューを開く'}
        aria-expanded={open}
        className="flex items-center justify-center p-2 rounded-lg text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
      >
        {open ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        )}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 top-12 z-40 bg-black/20"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed left-0 right-0 top-12 z-50 bg-white border-b border-[#d2d2d7] shadow-lg">
            <nav aria-label="モバイルメニュー">
              {NAV_LINKS.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block px-6 py-3.5 text-[15px] text-[#1d1d1f] hover:bg-[#f5f5f7] border-b border-[#f0f0f0] last:border-0 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <div className="px-6 py-4">
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="block rounded-full bg-[#0071e3] py-3 text-center text-[15px] font-medium text-white hover:bg-[#0077ed] transition-colors"
                >
                  無料で試す →
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  )
}
