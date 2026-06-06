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

// 大規模修繕の標準サイクル（田中顧問監修）
const TYPICAL_CYCLE: { year: number; work: string; estimate: number }[] = [
  { year: 12, work: '大規模修繕工事（外壁・防水・鉄部）', estimate: 25000000 },
  { year: 18, work: '給排水管更新工事', estimate: 15000000 },
  { year: 24, work: '大規模修繕工事（2回目）', estimate: 30000000 },
  { year: 30, work: 'エレベーター更新', estimate: 12000000 },
]

export default function RepairPlanPage() {
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [properties, setProperties] = useState<{ id: string; name: string; built_year?: number }[]>([])
  const [selectedProperty, setSelectedProperty] = useState('')
  const [builtYear, setBuiltYear] = useState(CURRENT_YEAR - 10)
  const [showTypical, setShowTypical] = useState(false)
  const [hovered, setHovered] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/properties').then(r => r.json()).then(d => setProperties(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedProperty) { setRepairs([]); return }
    fetch(`/api/repairs?property_id=${selectedProperty}`)
      .then(r => r.json())
      .then(setRepairs)
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

  // 標準サイクル計算
  const typicalData: Record<number, { work: string; estimate: number }[]> = {}
  if (showTypical) {
    for (const t of TYPICAL_CYCLE) {
      const y = builtYear + t.year
      if (!typicalData[y]) typicalData[y] = []
      typicalData[y].push({ work: t.work, estimate: t.estimate })
    }
  }

  // グラフ用データ（実績 + 標準サイクル）
  const allYears = new Set([...Object.keys(yearMap).map(Number), ...Object.keys(typicalData).map(Number)])
  const displayYears = PLAN_YEARS.filter(y => allYears.has(y) || y >= CURRENT_YEAR - 3)
  const maxAmount = Math.max(
    ...Object.values(yearMap).map(d => d.total),
    ...(showTypical ? Object.values(typicalData).map(d => d.reduce((s, t) => s + t.estimate, 0)) : [0]),
    1000000
  )

  function yen(n: number) {
    if (n >= 100000000) return `${(n / 100000000).toFixed(1)}億円`
    if (n >= 10000) return `${Math.round(n / 10000)}万円`
    return `${n.toLocaleString()}円`
  }

  const totalActual = Object.values(yearMap).reduce((s, d) => s + d.total, 0)
  const totalTypical = showTypical ? Object.values(typicalData).flat().reduce((s, t) => s + t.estimate, 0) : 0

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <h1 className="text-xl font-bold text-slate-900">長期修繕計画</h1>
        <p className="text-sm text-slate-500">修繕費用の実績と30年計画を可視化。総会資料として活用できます。</p>
      </div>

      {/* 絞り込み */}
      <div className="flex flex-wrap items-end gap-3 px-4 py-4 sm:px-6">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">物件</label>
          <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="">物件を選択</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">築年</label>
          <select value={builtYear} onChange={e => setBuiltYear(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            {Array.from({ length: 40 }, (_, i) => CURRENT_YEAR - 5 - i).map(y => (
              <option key={y} value={y}>{y}年築</option>
            ))}
          </select>
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <input type="checkbox" checked={showTypical} onChange={e => setShowTypical(e.target.checked)}
            className="h-4 w-4 rounded accent-blue-600" />
          <span className="text-sm font-medium text-slate-700">標準サイクル目安を表示</span>
        </label>
      </div>

      {/* サマリカード */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-4 sm:px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-400">実績修繕累計</p>
          <p className="mt-0.5 text-lg font-bold text-slate-800">{yen(totalActual)}</p>
        </div>
        {showTypical && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
            <p className="text-xs text-blue-400">30年計画目安（累計）</p>
            <p className="mt-0.5 text-lg font-bold text-blue-700">{yen(totalTypical)}</p>
          </div>
        )}
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
              const typical = showTypical ? (typicalData[y]?.reduce((s, t) => s + t.estimate, 0) ?? 0) : 0
              const actualH = actual ? Math.max(8, (actual / maxAmount) * 160) : 0
              const typicalH = typical ? Math.max(8, (typical / maxAmount) * 160) : 0
              const isCurrentYear = y === CURRENT_YEAR
              const isHovered = hovered === y
              const hasData = actual > 0 || typical > 0

              return (
                <div key={y} className="flex flex-col items-center"
                  onMouseEnter={() => setHovered(y)}
                  onMouseLeave={() => setHovered(null)}>
                  {/* ツールチップ */}
                  {isHovered && hasData && (
                    <div className="absolute z-10 mb-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg text-xs" style={{ transform: 'translateY(-120%)' }}>
                      <p className="font-bold text-slate-700 mb-1">{y}年</p>
                      {actual > 0 && <p className="text-slate-600">実績: {yen(actual)}</p>}
                      {typical > 0 && <p className="text-blue-600">目安: {yen(typical)}</p>}
                    </div>
                  )}

                  {/* バー */}
                  <div className="relative flex items-end gap-0.5" style={{ height: 160 }}>
                    {actual > 0 && (
                      <div className="w-4 rounded-t transition-all duration-200"
                        style={{ height: actualH, backgroundColor: isCurrentYear ? '#2563eb' : '#94a3b8' }} />
                    )}
                    {typical > 0 && (
                      <div className="w-4 rounded-t transition-all duration-200"
                        style={{ height: typicalH, backgroundColor: '#bfdbfe' }} />
                    )}
                    {!actual && !typical && (
                      <div className="w-4" style={{ height: 2 }} />
                    )}
                  </div>

                  {/* 年ラベル */}
                  <p className={`mt-1 text-[10px] ${isCurrentYear ? 'font-bold text-blue-600' : 'text-slate-400'}`} style={{ writingMode: 'vertical-rl', height: 36 }}>
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
            <span className="text-xs text-slate-500">実績修繕費</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-blue-600" />
            <span className="text-xs text-slate-500">今年（実績）</span>
          </div>
          {showTypical && (
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-blue-200" />
              <span className="text-xs text-slate-500">標準サイクル目安</span>
            </div>
          )}
        </div>
      </div>

      {/* 修繕一覧テーブル */}
      {selectedProperty && (
        <div className="mx-4 mb-6 rounded-xl border border-slate-200 bg-white sm:mx-6 overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="font-semibold text-slate-700">修繕実績・計画一覧</p>
          </div>
          {repairs.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">修繕データがありません</p>
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

      {/* 標準サイクル目安テーブル */}
      {showTypical && (
        <div className="mx-4 mb-6 rounded-xl border border-blue-100 bg-blue-50 sm:mx-6">
          <div className="border-b border-blue-100 px-4 py-3">
            <p className="font-semibold text-blue-800">標準修繕サイクル目安（築年{builtYear}年の場合）</p>
            <p className="text-xs text-blue-500 mt-0.5">田中顧問（元管理会社部長、35年経験）監修の標準スケジュール</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-blue-500">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">実施時期</th>
                  <th className="px-4 py-2 text-left font-medium">工事内容</th>
                  <th className="px-4 py-2 text-right font-medium">費用目安</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {TYPICAL_CYCLE.map((t, i) => (
                  <tr key={i} className="hover:bg-blue-100/50">
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-blue-800">{builtYear + t.year}年</p>
                      <p className="text-xs text-blue-400">築{t.year}年目</p>
                    </td>
                    <td className="px-4 py-2.5 text-blue-700">{t.work}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-blue-800">{yen(t.estimate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
