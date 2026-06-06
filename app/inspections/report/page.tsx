'use client'

import { useState, useEffect } from 'react'

type Inspection = {
  id: string
  inspection_type: string
  inspection_name: string
  next_due_date: string
  last_inspection_date: string | null
  frequency_months: number | null
  status: string
  result: string | null
  notes: string | null
  properties: { id: string; name: string } | null
  contractors: { id: string; name: string } | null
}

type Property = { id: string; name: string }

const TYPE_LABELS: Record<string, string> = {
  elevator: 'エレベーター定期検査',
  fire: '消防設備点検',
  building_survey: '特定建築物定期調査',
  building_equipment: '建築設備定期検査',
  water_tank: '貯水槽清掃',
  water_quality: '水質検査',
  drainage: '排水管清掃',
  parking: '機械式駐車場点検',
  electrical: '電気設備点検',
  other: 'その他',
}

function getDaysUntil(dateStr: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  return Math.ceil((due.getTime() - today.getTime()) / 86400000)
}

function statusLabel(days: number, status: string) {
  if (status === 'completed') return '完了'
  if (days < 0) return `期限超過（${Math.abs(days)}日）`
  if (days <= 30) return `要対応（${days}日後）`
  return `正常（${days}日後）`
}

function statusColor(days: number, status: string) {
  if (status === 'completed') return '#16a34a'
  if (days < 0) return '#dc2626'
  if (days <= 30) return '#ea580c'
  if (days <= 90) return '#ca8a04'
  return '#64748b'
}

export default function InspectionReportPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState('')
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(false)
  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })

  useEffect(() => {
    fetch('/api/properties').then(r => r.json()).then(setProperties).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedProperty) return
    setLoading(true)
    fetch(`/api/inspections?property_id=${selectedProperty}`)
      .then(r => r.json()).then(setInspections).finally(() => setLoading(false))
  }, [selectedProperty])

  const property = properties.find(p => p.id === selectedProperty)
  const overdue = inspections.filter(i => getDaysUntil(i.next_due_date) < 0 && i.status !== 'completed')
  const soon = inspections.filter(i => { const d = getDaysUntil(i.next_due_date); return d >= 0 && d <= 30 && i.status !== 'completed' })
  const normal = inspections.filter(i => { const d = getDaysUntil(i.next_due_date); return (d > 30 || i.status === 'completed') })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 画面操作（印刷時は非表示） */}
      <div className="print:hidden border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">法定点検レポート</h1>
            <p className="text-sm text-slate-500">理事会・管理組合への報告書を印刷・PDF保存</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="">物件を選択してください</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {inspections.length > 0 && (
              <button onClick={() => window.print()}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-500">
                PDF出力・印刷
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 物件未選択 */}
      {!selectedProperty && (
        <div className="print:hidden flex items-center justify-center p-16 text-slate-400">
          上の物件セレクターから物件を選択してください
        </div>
      )}

      {/* レポート本文（印刷対象） */}
      {selectedProperty && !loading && inspections.length > 0 && (
        <div className="mx-auto max-w-3xl p-6 print:p-0 print:max-w-none">

          {/* 印刷ヘッダー */}
          <div className="mb-6 border-b-2 border-slate-800 pb-4 print:mb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400">法定点検管理報告書</p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                  {property?.name ?? ''}
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">法定点検実施状況・次回予定一覧</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">作成日</p>
                <p className="text-sm font-semibold text-slate-700">{today}</p>
                <p className="mt-1 text-xs text-slate-300">Powered by Kura</p>
              </div>
            </div>
          </div>

          {/* サマリ */}
          <div className="mb-6 grid grid-cols-3 gap-3 print:gap-2">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center print:rounded-lg">
              <p className="text-3xl font-bold text-red-600">{overdue.length}</p>
              <p className="text-xs font-semibold text-red-500">期限超過</p>
              {overdue.length > 0 && <p className="mt-1 text-xs text-red-400">至急対応が必要です</p>}
            </div>
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-center print:rounded-lg">
              <p className="text-3xl font-bold text-orange-500">{soon.length}</p>
              <p className="text-xs font-semibold text-orange-400">今月中に期限</p>
              {soon.length > 0 && <p className="mt-1 text-xs text-orange-400">早急に手配が必要です</p>}
            </div>
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center print:rounded-lg">
              <p className="text-3xl font-bold text-green-600">{inspections.length}</p>
              <p className="text-xs font-semibold text-green-500">管理点検数（合計）</p>
            </div>
          </div>

          {/* 期限超過・要対応 */}
          {overdue.length + soon.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-red-700">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500"></span>
                至急対応が必要な点検
              </h2>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-red-200 bg-red-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-red-700">点検名称</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-red-700">種別</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-red-700">期限</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-red-700">状況</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-red-700">担当業者</th>
                  </tr>
                </thead>
                <tbody>
                  {[...overdue, ...soon].map(ins => {
                    const days = getDaysUntil(ins.next_due_date)
                    return (
                      <tr key={ins.id} className="border-b border-red-100">
                        <td className="px-3 py-2 font-medium text-slate-800">{ins.inspection_name}</td>
                        <td className="px-3 py-2 text-slate-500">{TYPE_LABELS[ins.inspection_type] ?? ins.inspection_type}</td>
                        <td className="px-3 py-2 text-slate-700">{ins.next_due_date}</td>
                        <td className="px-3 py-2">
                          <span style={{ color: statusColor(days, ins.status) }} className="font-semibold text-xs">
                            {statusLabel(days, ins.status)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-500">{ins.contractors?.name ?? '未設定'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 全点検一覧 */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
              <span className="inline-block h-2 w-2 rounded-full bg-slate-400"></span>
              全点検スケジュール一覧
            </h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50">
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">点検名称</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">種別</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">前回実施</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">次回期限</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">頻度</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">状況</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">担当業者</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map(ins => {
                  const days = getDaysUntil(ins.next_due_date)
                  return (
                    <tr key={ins.id} className="border-b border-slate-100">
                      <td className="px-3 py-2 font-medium text-slate-800">{ins.inspection_name}</td>
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{TYPE_LABELS[ins.inspection_type] ?? ins.inspection_type}</td>
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{ins.last_inspection_date ?? '—'}</td>
                      <td className="px-3 py-2 text-slate-700 font-medium whitespace-nowrap">{ins.next_due_date}</td>
                      <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{ins.frequency_months ? `${ins.frequency_months}ヶ月` : '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span style={{ color: statusColor(days, ins.status) }} className="font-semibold">
                          {statusLabel(days, ins.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{ins.contractors?.name ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* フッター */}
          <div className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-300">
            本レポートはKura（管理会社専用AI）により自動生成されました。{today}現在の情報です。
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-16 text-slate-400">読み込み中...</div>
      )}

      <style>{`
        @media print {
          @page { margin: 15mm; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  )
}
