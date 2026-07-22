'use client'

import { useEffect, useState } from 'react'

type Heading = { id: string; text: string; level: number }

export function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([])

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll('.prose h2, .prose h3'))
    const list: Heading[] = elements.map((el, i) => {
      const id = `toc-${i + 1}`
      el.id = id
      return { id, text: el.textContent ?? '', level: el.tagName === 'H2' ? 2 : 3 }
    })
    setHeadings(list)
  }, [])

  if (headings.length < 2) return null

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY - 72
    window.scrollTo({ top: y, behavior: 'smooth' })
  }

  return (
    <nav className="mb-10 rounded-xl border border-blue-100 bg-blue-50 p-6">
      <p className="mb-4 text-sm font-bold text-slate-700">
        目次
      </p>
      <ol className="space-y-1.5 list-none m-0 p-0">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? 'pl-5' : ''}>
            <button
              onClick={() => scrollTo(h.id)}
              className="text-left text-sm text-blue-700 hover:text-blue-900 hover:underline w-full leading-snug"
            >
              {h.level === 2 ? <span className="mr-1 text-blue-400">▶</span> : <span className="mr-1.5 text-slate-400">–</span>}
              {h.text}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
