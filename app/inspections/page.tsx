'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import FileAttachment from '@/app/components/FileAttachment'

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
  report_file_path: string | null
  report_file_name: string | null
  properties: { id: string; name: string } | null
  contractors: { id: string; name: string } | null
}

type Property = { id: string; name: string }

const INSPECTION_TYPES: Record<string, string> = {
  elevator: 'エレベーター',
  fire: '消防設備',
  building_survey: '建築物定期調査',
  building_equipment: '建築設備',
  water_tank: '貯水槽清掃',
  water_quality: '水質検査',
  drainage: '排水管清掃',
  parking: '機械式駐車場',
  electrical: '電気設備',
  other: 'その他',
}

function getDaysUntil(dateStr: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  return Math.ceil((due.getTime() - today.getTime()) / 86400000)
}

function StatusBadge({ daysUntil, status }: { daysUntil: number; status: string }) {
  if (status === 'completed') {
    return <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-600/20">完了</span>
  }
  if (daysUntil < 0) {
    return <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-600/20">期限超過 {Math.abs(daysUntil)}日</span>
  }
  if (daysUntil <= 30) {
    return <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 ring-1 ring-orange-600/20">今月中 {daysUntil}日後</span>
  }
  if (daysUntil <= 90) {
    return <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700 ring-1 ring-yellow-600/20">{daysUntil}日後</span>
  }
  return <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-500/20">{daysUntil}日後</span>
}

const BLANK_FORM = {
  property_id: '',
  inspection_type: 'elevator',
  inspection_name: '',
  next_due_date: '',
  last_inspection_date: '',
  frequency_months: 12,
  contractor_id: '',
  notes: '',
}

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [contractors, setContractors] = useState<{ id: string; name: string }[]>([])
  const [filterProperty, setFilterProperty] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Inspection | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [companyId, setCompanyId] = useState('')

  useEffect(() => { fetch('/api/me').then(r => r.json()).then(d => setCompanyId(d.companyId ?? '')).catch(() => {}) }, [])

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterProperty) params.set('property_id', filterProperty)
    const [insRes, propRes, conRes] = await Promise.all([
      fetch(`/api/inspections?${params}`),
      fetch('/api/properties'),
      fetch('/api/contractors'),
    ])
    if (insRes.ok) setInspections(await insRes.json())
    if (propRes.ok) { const d = await propRes.json(); setProperties(Array.isArray(d) ? d : []) }
    if (conRes.ok) setContractors(await conRes.json())
  }, [filterProperty])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditTarget(null)
    setForm(BLANK_FORM)
    setShowModal(true)
  }

  function openEdit(ins: Inspection) {
    setEditTarget(ins)
    setForm({
      property_id: ins.properties?.id ?? '',
      inspection_type: ins.inspection_type,
      inspection_name: ins.inspection_name,
      next_due_date: ins.next_due_date,
      last_inspection_date: ins.last_inspection_date ?? '',
      frequency_months: ins.frequency_months ?? 12,
      contractor_id: ins.contractors?.id ?? '',
      notes: ins.notes ?? '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        ...form,
        frequency_months: Number(form.frequency_months),
        contractor_id: form.contractor_id || null,
        last_inspection_date: form.last_inspection_date || null,
      }
      if (editTarget) {
        await fetch(`/api/inspections/${editTarget.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      } else {
        await fetch('/api/inspections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }
      setShowModal(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleComplete(id: string) {
    await fetch(`/api/inspections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', last_inspection_date: new Date().toISOString().split('T')[0] }),
    })
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('この点検記録を削除しますか？')) return
    await fetch(`/api/inspections/${id}`, { method: 'DELETE' })
    load()
  }

  const filtered = inspections.filter(ins => {
    if (filterStatus === 'overdue') return getDaysUntil(ins.next_due_date) < 0 && ins.status !== 'completed'
    if (filterStatus === 'soon') { const d = getDaysUntil(ins.next_due_date); return d >= 0 && d <= 30 && ins.status !== 'completed' }
    if (filterStatus === 'completed') return ins.status === 'completed'
    return true
  })

  const overdue = inspections.filter(i => getDaysUntil(i.next_due_date) < 0 && i.status !== 'completed').length
  const soon = inspections.filter(i => { const d = getDaysUntil(i.next_due_date); return d >= 0 && d <= 30 && i.status !== 'completed' }).length
  const quarter = inspections.filter(i => { const d = getDaysUntil(i.next_due_date); return d > 30 && d <= 90 && i.status !== 'completed' }).length

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">法定点検管理</h1>
            <p className="text-sm text-slate-500">法律で義務付けられた点検の期限を一元管理</p>
          </div>
          <button onClick={openNew} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            ＋ 点検を登録
          </button>
        </div>
      </div>

      {/* アラートサマリ */}
      <div className="grid grid-cols-3 gap-3 p-4 sm:gap-4 sm:px-6">
        <button onClick={() => setFilterStatus(filterStatus === 'overdue' ? '' : 'overdue')}
          className={`rounded-xl border p-3 text-left transition ${filterStatus === 'overdue' ? 'border-red-300 bg-red-50' : 'border-red-200 bg-white hover:bg-red-50'}`}>
          <p className="text-2xl font-bold text-red-600">{overdue}</p>
          <p className="text-xs font-medium text-red-500">期限超過</p>
        </button>
        <button onClick={() => setFilterStatus(filterStatus === 'soon' ? '' : 'soon')}
          className={`rounded-xl border p-3 text-left transition ${filterStatus === 'soon' ? 'border-orange-300 bg-orange-50' : 'border-orange-200 bg-white hover:bg-orange-50'}`}>
          <p className="text-2xl font-bold text-orange-500">{soon}</p>
          <p className="text-xs font-medium text-orange-400">今月中</p>
        </button>
        <button onClick={() => setFilterStatus(filterStatus === 'completed' ? '' : 'completed')}
          className={`rounded-xl border p-3 text-left transition ${filterStatus === 'completed' ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
          <p className="text-2xl font-bold text-slate-600">{quarter}</p>
          <p className="text-xs font-medium text-slate-400">3ヶ月以内</p>
        </button>
      </div>

      {/* フィルター */}
      <div className="px-4 pb-3 sm:px-6">
        <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:w-60">
          <option value="">全物件</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* 一覧 */}
      <div className="space-y-2 px-4 pb-6 sm:px-6">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">
            点検記録がありません。「点検を登録」から追加してください。
          </div>
        )}
        {filtered.map(ins => {
          const days = getDaysUntil(ins.next_due_date)
          const rowColor = ins.status === 'completed' ? 'border-green-100' : days < 0 ? 'border-red-200' : days <= 30 ? 'border-orange-200' : 'border-slate-200'
          return (
            <div key={ins.id} className={`rounded-xl border bg-white p-4 ${rowColor}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {INSPECTION_TYPES[ins.inspection_type] ?? ins.inspection_type}
                    </span>
                    <StatusBadge daysUntil={days} status={ins.status} />
                  </div>
                  <p className="mt-1 font-semibold text-slate-900">{ins.inspection_name}</p>
                  <p className="text-sm text-slate-500">{ins.properties?.name ?? '—'}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>次回期限: {ins.next_due_date}</span>
                    {ins.last_inspection_date && <span>前回: {ins.last_inspection_date}</span>}
                    {ins.contractors?.name && <span>業者: {ins.contractors.name}</span>}
                  </div>
                  {companyId && (
                    <div className="mt-2 max-w-sm">
                      <p className="mb-1 text-[10px] font-semibold text-slate-400">業者からの報告書</p>
                      <FileAttachment
                        companyId={companyId}
                        folder={`inspections/${ins.id}`}
                        filePath={ins.report_file_path}
                        fileName={ins.report_file_name}
                        onSaved={async (path, name) => {
                          await fetch(`/api/inspections/${ins.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ report_file_path: path, report_file_name: name }) })
                          load()
                        }}
                        onDeleted={async () => {
                          await fetch(`/api/inspections/${ins.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ report_file_path: null, report_file_name: null }) })
                          load()
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  {ins.status !== 'completed' && (
                    <button onClick={() => handleComplete(ins.id)}
                      className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100">
                      完了
                    </button>
                  )}
                  <button onClick={() => openEdit(ins)} className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">編集</button>
                  <button onClick={() => handleDelete(ins.id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">削除</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">{editTarget ? '点検を編集' : '点検を登録'}</h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="mb-1 block font-medium text-slate-700">物件 <span className="text-red-500">*</span></label>
                <select value={form.property_id} onChange={e => setForm(f => ({ ...f, property_id: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2">
                  <option value="">選択してください</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-700">点検種別</label>
                  <select value={form.inspection_type} onChange={e => setForm(f => ({ ...f, inspection_type: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2">
                    {Object.entries(INSPECTION_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">頻度</label>
                  <select value={form.frequency_months} onChange={e => setForm(f => ({ ...f, frequency_months: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2">
                    <option value={6}>半年</option>
                    <option value={12}>1年</option>
                    <option value={24}>2年</option>
                    <option value={36}>3年</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">点検名称 <span className="text-red-500">*</span></label>
                <input value={form.inspection_name} onChange={e => setForm(f => ({ ...f, inspection_name: e.target.value }))}
                  placeholder="例：エレベーター定期検査（○○号機）" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-700">次回期限 <span className="text-red-500">*</span></label>
                  <input type="date" value={form.next_due_date} onChange={e => setForm(f => ({ ...f, next_due_date: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">前回実施日</label>
                  <input type="date" value={form.last_inspection_date} onChange={e => setForm(f => ({ ...f, last_inspection_date: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">担当業者</label>
                <select value={form.contractor_id} onChange={e => setForm(f => ({ ...f, contractor_id: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2">
                  <option value="">未設定</option>
                  {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">メモ</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">キャンセル</button>
              <button onClick={handleSave} disabled={saving || !form.property_id || !form.inspection_name || !form.next_due_date}
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
