'use client'

import { useState, useEffect, useCallback } from 'react'

type Repair = {
  id: string
  title: string
  category: string | null
  amount: number | null
  start_date: string | null
  completion_date: string | null
  status: string
  description: string | null
  properties: { id: string; name: string } | null
  contractors: { id: string; name: string } | null
}

type Property = { id: string; name: string }

const CATEGORIES = ['共用部修繕', '設備修繕', '大規模修繕', '緊急修繕', '予防保全', '植栽管理', '清掃', 'その他']

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  planned: { label: '予定', color: 'bg-slate-100 text-slate-600' },
  in_progress: { label: '施工中', color: 'bg-blue-50 text-blue-700' },
  completed: { label: '完了', color: 'bg-green-50 text-green-700' },
}

const BLANK_FORM = {
  property_id: '',
  contractor_id: '',
  title: '',
  category: '共用部修繕',
  amount: '',
  start_date: '',
  completion_date: '',
  status: 'planned',
  description: '',
}

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [contractors, setContractors] = useState<{ id: string; name: string }[]>([])
  const [filterProperty, setFilterProperty] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Repair | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterProperty) params.set('property_id', filterProperty)
    const [repRes, propRes, conRes] = await Promise.all([
      fetch(`/api/repairs?${params}`),
      fetch('/api/properties'),
      fetch('/api/contractors'),
    ])
    if (repRes.ok) { const d = await repRes.json(); setRepairs(Array.isArray(d) ? d : []) }
    if (propRes.ok) { const d = await propRes.json(); setProperties(Array.isArray(d) ? d : []) }
    if (conRes.ok) { const d = await conRes.json(); setContractors(Array.isArray(d) ? d : []) }
  }, [filterProperty])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditTarget(null)
    setForm(BLANK_FORM)
    setShowModal(true)
  }

  function openEdit(r: Repair) {
    setEditTarget(r)
    setForm({
      property_id: r.properties?.id ?? '',
      contractor_id: r.contractors?.id ?? '',
      title: r.title,
      category: r.category ?? '共用部修繕',
      amount: r.amount?.toString() ?? '',
      start_date: r.start_date ?? '',
      completion_date: r.completion_date ?? '',
      status: r.status,
      description: r.description ?? '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        ...form,
        amount: form.amount ? Number(form.amount.replace(/,/g, '')) : null,
        contractor_id: form.contractor_id || null,
        start_date: form.start_date || null,
        completion_date: form.completion_date || null,
        description: form.description || null,
      }
      if (editTarget) {
        await fetch(`/api/repairs/${editTarget.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      } else {
        await fetch('/api/repairs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }
      setShowModal(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('この修繕記録を削除しますか？')) return
    await fetch(`/api/repairs/${id}`, { method: 'DELETE' })
    load()
  }

  const filtered = filterStatus ? repairs.filter(r => r.status === filterStatus) : repairs

  const totalAmount = filtered
    .filter(r => r.amount)
    .reduce((sum, r) => sum + (r.amount ?? 0), 0)

  function formatYen(n: number) {
    return n.toLocaleString('ja-JP') + '円'
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">修繕履歴管理</h1>
            <p className="text-sm text-slate-500">修繕実績・施工中・計画中を一元管理</p>
          </div>
          <button onClick={openNew} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            ＋ 修繕を登録
          </button>
        </div>
      </div>

      {/* フィルター */}
      <div className="flex flex-wrap gap-2 p-4 sm:px-6">
        <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="">全物件</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="flex gap-2">
          {[['', 'すべて'], ['planned', '予定'], ['in_progress', '施工中'], ['completed', '完了']].map(([v, l]) => (
            <button key={v} onClick={() => setFilterStatus(v)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${filterStatus === v ? 'bg-slate-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* 合計金額 */}
      {filtered.length > 0 && (
        <div className="mx-4 mb-3 rounded-xl border border-slate-200 bg-white p-3 sm:mx-6">
          <p className="text-xs text-slate-400">表示中の修繕合計</p>
          <p className="text-xl font-bold text-slate-900">{formatYen(totalAmount)}</p>
        </div>
      )}

      {/* 一覧 */}
      <div className="space-y-2 px-4 pb-6 sm:px-6">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">
            修繕記録がありません。「修繕を登録」から追加してください。
          </div>
        )}
        {filtered.map(r => {
          const sc = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.planned
          return (
            <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sc.color}`}>{sc.label}</span>
                    {r.category && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{r.category}</span>}
                  </div>
                  <p className="mt-1 font-semibold text-slate-900">{r.title}</p>
                  <p className="text-sm text-slate-500">{r.properties?.name ?? '—'}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
                    {r.amount && <span className="font-semibold text-slate-700">{formatYen(r.amount)}</span>}
                    {r.start_date && <span>開始: {r.start_date}</span>}
                    {r.completion_date && <span>完了: {r.completion_date}</span>}
                    {r.contractors?.name && <span>業者: {r.contractors.name}</span>}
                  </div>
                  {r.description && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{r.description}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => openEdit(r)} className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">編集</button>
                  <button onClick={() => handleDelete(r.id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">削除</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-h-[90vh] sm:rounded-2xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">{editTarget ? '修繕を編集' : '修繕を登録'}</h2>
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
                <label className="mb-1 block font-medium text-slate-700">修繕内容 <span className="text-red-500">*</span></label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="例：外壁塗装工事" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-700">カテゴリ</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">ステータス</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2">
                    <option value="planned">予定</option>
                    <option value="in_progress">施工中</option>
                    <option value="completed">完了</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">金額（円）</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="1000000" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-700">開始日</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">完了日</label>
                  <input type="date" value={form.completion_date} onChange={e => setForm(f => ({ ...f, completion_date: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">施工業者</label>
                <select value={form.contractor_id} onChange={e => setForm(f => ({ ...f, contractor_id: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2">
                  <option value="">未設定</option>
                  {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">備考</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
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
