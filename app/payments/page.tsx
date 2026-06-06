'use client'

import { useState, useEffect, useCallback } from 'react'

type PaymentRecord = {
  id: string
  billing_year: number
  billing_month: number
  management_fee: number
  reserve_fund: number
  other_fee: number
  paid_amount: number
  payment_date: string | null
  status: string
  dunning_count: number
  last_dunning_date: string | null
  notes: string | null
  units: { unit_number: string; floor: number | null } | null
  residents: { name: string; phone: string | null } | null
}

type Property = { id: string; name: string }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  paid:    { label: '入金済', color: 'text-green-700', bg: 'bg-green-50' },
  partial: { label: '一部入金', color: 'text-yellow-700', bg: 'bg-yellow-50' },
  unpaid:  { label: '未払い', color: 'text-red-700', bg: 'bg-red-50' },
}

const now = new Date()

export default function PaymentsPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [records, setRecords] = useState<PaymentRecord[]>([])
  const [selectedProperty, setSelectedProperty] = useState('')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkFees, setBulkFees] = useState({ management_fee: '18000', reserve_fund: '8000', other_fee: '0' })
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => { fetch('/api/properties').then(r => r.json()).then(setProperties).catch(() => {}) }, [])

  const load = useCallback(async () => {
    if (!selectedProperty) return
    const params = new URLSearchParams({ property_id: selectedProperty, year: String(year), month: String(month) })
    const res = await fetch(`/api/payments?${params}`)
    if (res.ok) setRecords(await res.json())
  }, [selectedProperty, year, month])

  useEffect(() => { load() }, [load])

  async function handlePaid(id: string, total: number) {
    setActionLoading(id)
    await fetch(`/api/payments/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paid_amount: total }) })
    setActionLoading(null)
    load()
  }

  async function handleDunning(id: string) {
    setActionLoading(id)
    await fetch(`/api/payments/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dunning: true }) })
    setActionLoading(null)
    load()
  }

  async function handleBulkCreate() {
    setSaving(true)
    await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bulk: true,
        property_id: selectedProperty,
        billing_year: year,
        billing_month: month,
        management_fee: parseInt(bulkFees.management_fee),
        reserve_fund: parseInt(bulkFees.reserve_fund),
        other_fee: parseInt(bulkFees.other_fee),
      }),
    })
    setSaving(false)
    setShowBulkModal(false)
    load()
  }

  const totalBilled = records.reduce((s, r) => s + r.management_fee + r.reserve_fund + r.other_fee, 0)
  const totalPaid = records.reduce((s, r) => s + r.paid_amount, 0)
  const unpaidCount = records.filter(r => r.status !== 'paid').length

  function yen(n: number) { return n.toLocaleString('ja-JP') + '円' }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">管理費・督促管理</h1>
            <p className="text-sm text-slate-500">管理費・修繕積立金の未払い状況と督促を管理</p>
          </div>
          {selectedProperty && (
            <button onClick={() => setShowBulkModal(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
              ＋ 月次請求を一括作成
            </button>
          )}
        </div>
      </div>

      {/* 絞り込み */}
      <div className="flex flex-wrap gap-3 p-4 sm:px-6">
        <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="">物件を選択</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => <option key={y} value={y}>{y}年</option>)}
        </select>
        <select value={month} onChange={e => setMonth(Number(e.target.value))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}月</option>)}
        </select>
      </div>

      {!selectedProperty ? (
        <div className="flex items-center justify-center p-16 text-slate-400">物件を選択してください</div>
      ) : (
        <>
          {/* サマリ */}
          <div className="grid grid-cols-2 gap-3 px-4 pb-3 sm:grid-cols-4 sm:px-6">
            {[
              { label: '請求総額', value: yen(totalBilled), color: 'text-slate-800' },
              { label: '入金済み', value: yen(totalPaid), color: 'text-green-700' },
              { label: '未収額', value: yen(totalBilled - totalPaid), color: 'text-red-600' },
              { label: '未払い戸数', value: `${unpaidCount}戸`, color: 'text-red-600' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className={`mt-0.5 text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* 一覧 */}
          {records.length === 0 ? (
            <div className="mx-4 rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400 sm:mx-6">
              <p>この月の請求データがありません</p>
              <button onClick={() => setShowBulkModal(true)} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
                月次請求を一括作成する
              </button>
            </div>
          ) : (
            <div className="space-y-2 px-4 pb-6 sm:px-6">
              {/* 未払い優先ソート */}
              {[...records].sort((a, b) => {
                const order = { unpaid: 0, partial: 1, paid: 2 }
                return (order[a.status as keyof typeof order] ?? 3) - (order[b.status as keyof typeof order] ?? 3)
              }).map(r => {
                const total = r.management_fee + r.reserve_fund + r.other_fee
                const sc = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.unpaid
                const isLoading = actionLoading === r.id
                return (
                  <div key={r.id} className={`rounded-xl border bg-white p-4 ${r.status === 'unpaid' ? 'border-red-200' : r.status === 'partial' ? 'border-yellow-200' : 'border-slate-200'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">{r.units?.unit_number}号室</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sc.bg} ${sc.color}`}>{sc.label}</span>
                          {r.dunning_count > 0 && (
                            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">督促{r.dunning_count}回</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-slate-600">{r.residents?.name ?? '居住者未登録'}</p>
                        {r.residents?.phone && (
                          <a href={`tel:${r.residents.phone}`} className="text-xs text-blue-500 hover:underline">{r.residents.phone}</a>
                        )}
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                          <span>管理費 {yen(r.management_fee)}</span>
                          <span>積立金 {yen(r.reserve_fund)}</span>
                          {r.other_fee > 0 && <span>その他 {yen(r.other_fee)}</span>}
                          <span className="font-semibold text-slate-700">合計 {yen(total)}</span>
                        </div>
                        {r.payment_date && <p className="mt-1 text-xs text-green-600">入金日: {r.payment_date}</p>}
                        {r.last_dunning_date && <p className="mt-0.5 text-xs text-orange-500">最終督促: {r.last_dunning_date}</p>}
                      </div>
                      {r.status !== 'paid' && (
                        <div className="flex shrink-0 flex-col gap-1.5">
                          <button onClick={() => handlePaid(r.id, total)} disabled={isLoading}
                            className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50">
                            {isLoading ? '...' : '入金確認'}
                          </button>
                          <button onClick={() => handleDunning(r.id)} disabled={isLoading}
                            className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-50">
                            督促済みにする
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* 一括作成モーダル */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
            <h2 className="mb-1 text-lg font-bold text-slate-900">{year}年{month}月 月次請求一括作成</h2>
            <p className="mb-4 text-xs text-slate-500">登録済み全戸室分の請求レコードを作成します</p>
            <div className="space-y-3 text-sm">
              {[
                { label: '管理費（円/戸）', key: 'management_fee' as const },
                { label: '修繕積立金（円/戸）', key: 'reserve_fund' as const },
                { label: 'その他（円/戸）', key: 'other_fee' as const },
              ].map(f => (
                <div key={f.key}>
                  <label className="mb-1 block font-medium text-slate-700">{f.label}</label>
                  <input type="number" value={bulkFees[f.key]} onChange={e => setBulkFees(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
              ))}
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                合計: {(parseInt(bulkFees.management_fee || '0') + parseInt(bulkFees.reserve_fund || '0') + parseInt(bulkFees.other_fee || '0')).toLocaleString()}円/戸
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowBulkModal(false)} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700">キャンセル</button>
              <button onClick={handleBulkCreate} disabled={saving}
                className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                {saving ? '作成中...' : '一括作成'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
