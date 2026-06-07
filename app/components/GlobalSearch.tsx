'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type SearchResults = {
  properties: { id: string; name: string; address: string | null }[]
  residents: { id: string; name: string; phone: string | null; properties: { name: string } | null; units: { unit_number: string } | null }[]
  cases: { id: string; title: string; status: string; properties: { name: string } | null }[]
  inspections: { id: string; inspection_name: string; next_due_date: string; properties: { name: string } | null }[]
  contractors: { id: string; name: string; phone: string | null }[]
}

const EMPTY: SearchResults = { properties: [], residents: [], cases: [], inspections: [], contractors: [] }

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>(EMPTY)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Cmd+K / Ctrl+K でオープン
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(o => !o) }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50) }, [open])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults(EMPTY); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (res.ok) setResults(await res.json())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query), 300)
    return () => clearTimeout(t)
  }, [query, search])

  function handleClose() { setOpen(false); setQuery(''); setResults(EMPTY) }

  function go(href: string) { router.push(href); handleClose() }

  const total = results.properties.length + results.residents.length + results.cases.length + results.inspections.length + results.contractors.length

  return (
    <>
      {/* 検索トリガーボタン（デスクトップ：テキスト付き / モバイル：アイコンのみ） */}
      <button onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 hover:border-blue-300 hover:bg-white transition">
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
        </svg>
        <span className="flex-1 text-left text-xs sm:text-sm">検索...</span>
        <kbd className="hidden rounded bg-slate-200 px-1.5 py-0.5 text-xs lg:block">⌘K</kbd>
      </button>

      {/* モーダル */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4" onClick={handleClose}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* 入力 */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
              <svg className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                placeholder="物件名・居住者名・案件・点検名で検索..."
                className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none" />
              {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />}
              <button onClick={handleClose} className="text-xs text-slate-400 hover:text-slate-600">ESC</button>
            </div>

            {/* 結果 */}
            <div className="max-h-[60vh] overflow-y-auto">
              {query && !loading && total === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">「{query}」の検索結果はありません</p>
              )}
              {!query && (
                <p className="py-8 text-center text-sm text-slate-400">キーワードを入力してください</p>
              )}

              {results.properties.length > 0 && (
                <div>
                  <p className="bg-slate-50 px-4 py-1.5 text-xs font-semibold text-slate-500">物件</p>
                  {results.properties.map(p => (
                    <button key={p.id} onClick={() => go(`/properties/${p.id}`)}
                      className="flex w-full items-center gap-3 px-4 py-3 hover:bg-blue-50 transition text-left">
                      <span className="h-2 w-2 rounded-full bg-blue-400 shrink-0" />
                      <div><p className="text-sm font-medium text-slate-800">{p.name}</p>
                        {p.address && <p className="text-xs text-slate-400">{p.address}</p>}</div>
                    </button>
                  ))}
                </div>
              )}

              {results.residents.length > 0 && (
                <div>
                  <p className="bg-slate-50 px-4 py-1.5 text-xs font-semibold text-slate-500">居住者</p>
                  {results.residents.map(r => (
                    <button key={r.id} onClick={() => go('/residents')}
                      className="flex w-full items-center gap-3 px-4 py-3 hover:bg-blue-50 transition text-left">
                      <span className="h-2 w-2 rounded-full bg-purple-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{r.name}</p>
                        <p className="text-xs text-slate-400">
                          {r.properties?.name}{r.units?.unit_number ? ` ${r.units.unit_number}号室` : ''}{r.phone ? ` · ${r.phone}` : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.cases.length > 0 && (
                <div>
                  <p className="bg-slate-50 px-4 py-1.5 text-xs font-semibold text-slate-500">案件</p>
                  {results.cases.map(c => (
                    <button key={c.id} onClick={() => go('/cases')}
                      className="flex w-full items-center gap-3 px-4 py-3 hover:bg-blue-50 transition text-left">
                      <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{c.title}</p>
                        <p className="text-xs text-slate-400">{c.properties?.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.inspections.length > 0 && (
                <div>
                  <p className="bg-slate-50 px-4 py-1.5 text-xs font-semibold text-slate-500">法定点検</p>
                  {results.inspections.map(i => (
                    <button key={i.id} onClick={() => go('/inspections')}
                      className="flex w-full items-center gap-3 px-4 py-3 hover:bg-blue-50 transition text-left">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{i.inspection_name}</p>
                        <p className="text-xs text-slate-400">{i.properties?.name} · 期限: {i.next_due_date}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.contractors.length > 0 && (
                <div>
                  <p className="bg-slate-50 px-4 py-1.5 text-xs font-semibold text-slate-500">業者</p>
                  {results.contractors.map(c => (
                    <button key={c.id} onClick={() => go('/contractors')}
                      className="flex w-full items-center gap-3 px-4 py-3 hover:bg-blue-50 transition text-left">
                      <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{c.name}</p>
                        {c.phone && <p className="text-xs text-slate-400">{c.phone}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
