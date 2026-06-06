'use client'

import { useState, useEffect, useCallback } from 'react'

type Estimate = {
  id: string
  title: string
  amount: number | null
  submitted_date: string | null
  validity_date: string | null
  status: string
  notes: string | null
  properties: { id: string; name: string } | null
  contractors: { id: string; name: string } | null
}

type Property = { id: string; name: string }

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: '検討中', color: 'bg-yellow-50 text-yellow-700' },
  accepted: { label: '採用', color: 'bg-green-50 text-green-700' },
  rejected: { label: '見送り', color: 'bg-slate-100 text-slate-500' },
}

const BLANK_FORM = {
  property_id: '',
  contractor_id: '',
  title: '',
  amount: '',
  submitted_date: '',
  validity_date: '',
  status: 'pending',
  notes: '',
}

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [contractors, setContractors] = useState<{ id: string; name: string }[]>([])
  const [filterProperty, setFilterProperty] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Estimate | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterProperty) params.set('property_id', filterProperty)
    const [estRes, propRes, conRes] = await Promise.all([
      fetch(`/api/estimates?${params}`),
      fetch('/api/properties'),
      fetch('/api/contractors'),
    ])
    if (estRes.ok) setEstimates(await estRes.json())
    if (propRes.ok) setProperties(await propRes.json())
    if (conRes.ok) setContractors(await conRes.json())
  }, [filterProperty])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditTarget(null)
    setForm(BLANK_FORM)
    setShowModal(true)
  }

  function openEdit(e: Estimate) {
    setEditTarget(e)
    setForm({
      property_id: e.properties?.id ?? '',
      contractor_id: e.contractors?.id ?? '',
      title: e.title,
      amount: e.amount?.toString() ?? '',
      submitted_date: e.submitted_date ?? '',
      validity_date: e.validity_date ?? '',
      status: e.status,
      notes: e.notes ?? '',
    })
    setShowModal(true)
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/estimates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        ...form,
        amount: form.amount ? Number(form.amount.replace(/,/g, '')) : null,
        contractor_id: form.contractor_id || null,
        submitted_date: form.submitted_date || null,
        validity_date: form.validity_date || null,
        notes: form.notes || null,
      }
      if (editTarget) {
        await fetch(`/api/estimates/${editTarget.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      } else {
        await fetch('/api/estimates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }
      setShowModal(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('この見積を削除しますか？')) return
    await fetch(`/api/estimates/${id}`, { method: 'DELETE' })
    load()
  }

  function formatYen(n: number) {
    return n.toLocaleString('ja-JP') + '円'
  }

  // 同一物件・同一案件の見積をグループ化して比較しやすくする
  const groupedByProperty = estimates.reduce<Record<string, Estimate[]>>((acc, e) => {
    const key = e.properties?.id ?? 'none'
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">見積管理</h1>
            <p className="text-sm text-slate-500">相見積もりを物件別に比較・管理</p>
          </div>
          <button onClick={openNew} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            ＋ 見積を登録
          </button>
        </div>
      </div>

      {/* 物件フィルター */}
      <div className="p-4 sm:px-6">
        <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:w-60">
          <option value="">全物件</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* 物件別グループ表示 */}
      <div className="space-y-4 px-4 pb-6 sm:px-6">
        {estimates.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">
            見積がありません。「見積を登録」から追加してください。
          </div>
        )}
        {Object.entries(groupedByProperty).map(([propertyId, items]) => {
          const propertyName = items[0]?.properties?.name ?? '物件未設定'
          const minAmount = Math.min(...items.filter(i => i.amount).map(i => i.amount!))
          return (
            <div key={propertyId} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                <p className="font-semibold text-slate-700">{propertyName}</p>
                <p className="text-xs text-slate-400">{items.length}社から見積取得</p>
              </div>
              <div className="divide-y divide-slate-100">
                {items.map(e => {
                  const sc = STATUS_CONFIG[e.status] ?? STATUS_CONFIG.pending
                  const isCheapest = e.amount === minAmount && items.filter(i => i.amount).length > 1
                  return (
                    <div key={e.id} className={`p-4 ${isCheapest && e.amount ? 'bg-green-50/40' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sc.color}`}>{sc.label}</span>
                            {isCheapest && e.amount && (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">最安値</span>
                            )}
                          </div>
                          <p className="mt-1 font-semibold text-slate-900">{e.title}</p>
                          <p className="text-sm text-slate-500">{e.contractors?.name ?? '業者未設定'}</p>
                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
                            {e.amount && <span className="text-base font-bold text-slate-800">{formatYen(e.amount)}</span>}
                            {e.submitted_date && <span>提出: {e.submitted_date}</span>}
                            {e.validity_date && <span>有効期限: {e.validity_date}</span>}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col gap-1.5">
                          {e.status === 'pending' && (
                            <>
                              <button onClick={() => handleStatusChange(e.id, 'accepted')}
                                className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100">採用</button>
                              <button onClick={() => handleStatusChange(e.id, 'rejected')}
                                className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100">見送り</button>
                            </>
                          )}
                          <button onClick={() => openEdit(e)} className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">編集</button>
                          <button onClick={() => handleDelete(e.id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">削除</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-h-[90vh] sm:rounded-2xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">{editTarget ? '見積を編集' : '見積を登録'}</h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="mb-1 block font-medium text-slate-700">物件 <span className="text-red-500">*</span></label>
                <select value={form.property_id} onChange={e => setForm(f => ({ ...f, property_id: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2">
                  <option value="">選択してください</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">件名 <span className="text-red-500">*</span></label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="例：外壁塗装工事見積" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">業者</label>
                <select value={form.contractor_id} onChange={e => setForm(f => ({ ...f, contractor_id: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2">
                  <option value="">未設定</option>
                  {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">金額（円）</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="1500000" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-700">提出日</label>
                  <input type="date" value={form.submitted_date} onChange={e => setForm(f => ({ ...f, submitted_date: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">有効期限</label>
                  <input type="date" value={form.validity_date} onChange={e => setForm(f => ({ ...f, validity_date: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">備考</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">キャンセル</button>
              <button onClick={handleSave} disabled={saving || !form.property_id || !form.title}
                className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
