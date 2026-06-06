'use client'

import { useState, useEffect } from 'react'

type Repair = {
  id: string
  title: string
  category: string
  amount: number
  start_date: string | null
  completion_date: string | null
  status: string
  properties: { name: string } | null
}

type YearData = {
  year: number
  total: number
  items: Repair[]
}

const CURRENT_YEAR = new Date().getFullYear()
const PLAN_YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR + i)

export default function RepairPlanPage() {
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [selectedProperty, setSelectedProperty] = useState('')
  const [hovered, setHovered] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/properties').then(r => r.json()).then(d => setProperties(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedProperty) { setRepairs([]); return }
    fetch(`/api/repairs?property_id=${selectedProperty}`)
      .then(r => r.json())
      .then(d => setRepairs(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [selectedProperty])

  // 修繕データを年次集計
  const yearMap: Record<number, YearData> = {}
  for (const r of repairs) {
    const date = r.start_date || r.completion_date
    if (!date) continue
    const y = new Date(date).getFullYear()
    if (!yearMap[y]) yearMap[y] = { year: y, total: 0, items: [] }
    yearMap[y].total += r.amount ?? 0
    yearMap[y].items.push(r)
  }

  const displayYears = PLAN_YEARS.filter(y => Object.keys(yearMap).map(Number).includes(y) || y >= CURRENT_YEAR - 3)
  const maxAmount = Math.max(...Object.values(yearMap).map(d => d.total), 1000000)

  function yen(n: number) {
    if (n >= 100000000) return `${(n / 100000000).toFixed(1)}億円`
    if (n >= 10000) return `${Math.round(n / 10000)}万円`
    return `${n.toLocaleString()}円`
  }

  const totalActual = Object.values(yearMap).reduce((s, d) => s + d.total, 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <h1 className="text-xl font-bold text-slate-900">長期修繕計画</h1>
        <p className="text-sm text-slate-500">修繕履歴の実績費用を年次グラフで可視化します。</p>
        <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold mb-1">このページの使い方</p>
          <p>「修繕履歴」ページで工事実績・計画を登録すると、ここに自動でグラフ表示されます。実際に支払った金額・工期を修繕履歴に記録してください。</p>
        </div>
      </div>

      {/* 物件選択 */}
      <div className="px-4 py-4 sm:px-6">
        <label className="mb-1 block text-xs font-medium text-slate-500">物件</label>
        <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="">物件を選択</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* サマリカード */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-400">実績修繕累計</p>
          <p className="mt-0.5 text-lg font-bold text-slate-800">{yen(totalActual)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-400">登録修繕件数</p>
          <p className="mt-0.5 text-lg font-bold text-slate-800">{repairs.length}件</p>
        </div>
      </div>

      {/* バーチャート */}
      <div className="mx-4 mb-4 rounded-xl border border-slate-200 bg-white px-4 pt-4 pb-2 sm:mx-6">
        <p className="mb-3 text-sm font-semibold text-slate-700">年次修繕費用グラフ</p>

        <div className="overflow-x-auto">
          <div className="flex min-w-max items-end gap-1 pb-1" style={{ minHeight: 200 }}>
            {displayYears.map(y => {
              const actual = yearMap[y]?.total ?? 0
              const actualH = actual ? Math.max(8, (actual / maxAmount) * 160) : 0
              const isCurrentYear = y === CURRENT_YEAR
              const isHovered = hovered === y

              return (
                <div key={y} className="flex flex-col items-center relative"
                  onMouseEnter={() => setHovered(y)}
                  onMouseLeave={() => setHovered(null)}>
                  {/* ツールチップ */}
                  {isHovered && actual > 0 && (
                    <div className="absolute bottom-full mb-2 z-10 rounded-lg border border-slate-200 bg-white p-2 shadow-lg text-xs whitespace-nowrap">
                      <p className="font-bold text-slate-700 mb-0.5">{y}年</p>
                      <p className="text-slate-600">{yen(actual)}</p>
                      {yearMap[y]?.items.map((r, i) => (
                        <p key={i} className="text-slate-400">{r.title}</p>
                      ))}
                    </div>
                  )}

                  {/* バー */}
                  <div className="relative flex items-end" style={{ height: 160 }}>
                    {actual > 0 ? (
                      <div className="w-5 rounded-t transition-all duration-200"
                        style={{ height: actualH, backgroundColor: isCurrentYear ? '#2563eb' : '#94a3b8' }} />
                    ) : (
                      <div className="w-5" style={{ height: 2 }} />
                    )}
                  </div>

                  {/* 年ラベル */}
                  <p className={`mt-1 text-[10px] ${isCurrentYear ? 'font-bold text-blue-600' : 'text-slate-400'}`}
                    style={{ writingMode: 'vertical-rl', height: 36 }}>
                    {y}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* 凡例 */}
        <div className="mt-2 flex flex-wrap gap-3 border-t border-slate-100 pt-2">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-slate-400" />
            <span className="text-xs text-slate-500">修繕実績費用</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-blue-600" />
            <span className="text-xs text-slate-500">今年</span>
          </div>
        </div>
      </div>

      {/* 修繕一覧テーブル */}
      {selectedProperty && (
        <div className="mx-4 mb-6 rounded-xl border border-slate-200 bg-white sm:mx-6 overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="font-semibold text-slate-700">修繕実績・計画一覧</p>
          </div>
          {repairs.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              <p>修繕データがありません</p>
              <p className="mt-1 text-xs">「修繕履歴」ページから工事実績を登録してください</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">工事名</th>
                    <th className="px-4 py-2 text-left font-medium">カテゴリ</th>
                    <th className="px-4 py-2 text-left font-medium">開始日</th>
                    <th className="px-4 py-2 text-right font-medium">費用</th>
                    <th className="px-4 py-2 text-left font-medium">状況</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...repairs].sort((a, b) => (b.start_date ?? '').localeCompare(a.start_date ?? '')).map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{r.title}</td>
                      <td className="px-4 py-2.5 text-slate-500">{r.category}</td>
                      <td className="px-4 py-2.5 text-slate-500">{r.start_date ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{yen(r.amount)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          r.status === 'completed' ? 'bg-green-50 text-green-700' :
                          r.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                          'bg-slate-50 text-slate-500'
                        }`}>
                          {r.status === 'completed' ? '完了' : r.status === 'in_progress' ? '施工中' : '計画'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
