'use client'

import { useState, useEffect, useCallback } from 'react'

type Request = {
  id: string
  title: string
  category: string
  description: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  properties: { id: string; name: string } | null
  units: { unit_number: string } | null
  residents: { name: string; phone: string | null } | null
}

type Property = { id: string; name: string }

const CATEGORIES: Record<string, string> = {
  repair: '修繕要望',
  complaint: 'クレーム',
  inquiry: '問い合わせ',
  other: 'その他',
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  urgent: { label: '緊急', color: 'bg-red-100 text-red-700' },
  high: { label: '高', color: 'bg-orange-100 text-orange-700' },
  normal: { label: '通常', color: 'bg-blue-50 text-blue-600' },
  low: { label: '低', color: 'bg-slate-100 text-slate-500' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; next: string; nextLabel: string }> = {
  new: { label: '新規', color: 'bg-red-50 text-red-700', next: 'in_progress', nextLabel: '対応開始' },
  in_progress: { label: '対応中', color: 'bg-blue-50 text-blue-700', next: 'resolved', nextLabel: '解決済みへ' },
  resolved: { label: '解決済み', color: 'bg-green-50 text-green-700', next: 'closed', nextLabel: '完了' },
  closed: { label: '完了', color: 'bg-slate-100 text-slate-500', next: '', nextLabel: '' },
}

const BLANK_FORM = {
  property_id: '',
  title: '',
  category: 'inquiry',
  description: '',
  priority: 'normal',
}

export default function ResidentPortalPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [filterStatus, setFilterStatus] = useState('new')
  const [filterProperty, setFilterProperty] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (filterProperty) params.set('property_id', filterProperty)
    const [reqRes, propRes] = await Promise.all([
      fetch(`/api/resident-requests?${params}`),
      fetch('/api/properties'),
    ])
    if (reqRes.ok) setRequests(await reqRes.json())
    if (propRes.ok) setProperties(await propRes.json())
  }, [filterStatus, filterProperty])

  useEffect(() => { load() }, [load])

  async function handleStatusAdvance(req: Request) {
    const sc = STATUS_CONFIG[req.status]
    if (!sc.next) return
    await fetch(`/api/resident-requests/${req.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: sc.next }),
    })
    load()
  }

  async function handleSave() {
    setSaving(true)
    try {
      await fetch('/api/resident-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setShowModal(false)
      setForm(BLANK_FORM)
      load()
    } finally {
      setSaving(false)
    }
  }

  const counts = {
    new: requests.filter(r => r.status === 'new').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    resolved: requests.filter(r => r.status === 'resolved').length,
  }

  function timeSince(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    const hours = Math.floor((now.getTime() - d.getTime()) / 3600000)
    if (hours < 1) return '1時間以内'
    if (hours < 24) return `${hours}時間前`
    return `${Math.floor(hours / 24)}日前`
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">居住者問い合わせ管理</h1>
            <p className="text-sm text-slate-500">住民からの修繕要望・クレーム・問い合わせを管理</p>
          </div>
          <button onClick={() => setShowModal(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            ＋ 問い合わせ登録
          </button>
        </div>
      </div>

      {/* サマリ */}
      <div className="grid grid-cols-3 gap-3 p-4 sm:px-6">
        {[
          { key: 'new', label: '新規', value: counts.new, color: 'text-red-600', border: 'border-red-200' },
          { key: 'in_progress', label: '対応中', value: counts.in_progress, color: 'text-blue-600', border: 'border-blue-200' },
          { key: 'resolved', label: '解決済み', value: counts.resolved, color: 'text-green-600', border: 'border-green-200' },
        ].map(s => (
          <button key={s.key} onClick={() => setFilterStatus(filterStatus === s.key ? '' : s.key)}
            className={`rounded-xl border bg-white p-3 text-left transition ${filterStatus === s.key ? s.border + ' ring-2 ring-offset-1 ring-blue-300' : 'border-slate-200 hover:bg-slate-50'}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </button>
        ))}
      </div>

      {/* フィルター */}
      <div className="flex flex-wrap gap-2 px-4 pb-3 sm:px-6">
        <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="">全物件</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="flex gap-1">
          {[['', 'すべて'], ['new', '新規'], ['in_progress', '対応中'], ['resolved', '解決済み'], ['closed', '完了']].map(([v, l]) => (
            <button key={v} onClick={() => setFilterStatus(v)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${filterStatus === v ? 'bg-slate-700 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* 一覧 */}
      <div className="space-y-2 px-4 pb-6 sm:px-6">
        {requests.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">
            問い合わせがありません。
          </div>
        )}
        {requests.map(req => {
          const sc = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.new
          const pc = PRIORITY_CONFIG[req.priority] ?? PRIORITY_CONFIG.normal
          return (
            <div key={req.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sc.color}`}>{sc.label}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${pc.color}`}>{pc.label}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{CATEGORIES[req.category] ?? req.category}</span>
                  </div>
                  <p className="mt-1 font-semibold text-slate-900">{req.title}</p>
                  <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-slate-400">
                    {req.properties?.name && <span>{req.properties.name}</span>}
                    {req.units?.unit_number && <span>{req.units.unit_number}号室</span>}
                    {req.residents?.name && <span>{req.residents.name}</span>}
                    {req.residents?.phone && <a href={`tel:${req.residents.phone}`} className="text-blue-400 hover:underline">{req.residents.phone}</a>}
                    <span>{timeSince(req.created_at)}</span>
                  </div>
                  {req.description && <p className="mt-1.5 text-sm text-slate-600 line-clamp-2">{req.description}</p>}
                </div>
                {sc.next && (
                  <button onClick={() => handleStatusAdvance(req)}
                    className="shrink-0 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                    {sc.nextLabel}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 登録モーダル */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">問い合わせを登録</h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="mb-1 block font-medium text-slate-700">物件</label>
                <select value={form.property_id} onChange={e => setForm(f => ({ ...f, property_id: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2">
                  <option value="">選択してください</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-700">カテゴリ</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2">
                    {Object.entries(CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">優先度</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2">
                    <option value="urgent">緊急</option>
                    <option value="high">高</option>
                    <option value="normal">通常</option>
                    <option value="low">低</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">件名 <span className="text-red-500">*</span></label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="例：101号室 水漏れ修繕依頼" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">詳細 <span className="text-red-500">*</span></label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={4} placeholder="問い合わせの詳細内容..." className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">キャンセル</button>
              <button onClick={handleSave} disabled={saving || !form.title || !form.description}
                className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                {saving ? '登録中...' : '登録'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
