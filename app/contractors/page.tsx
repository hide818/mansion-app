'use client'

import { useState, useEffect, useCallback } from 'react'

type Contractor = {
  id: string
  name: string
  categories: string[]
  phone: string | null
  email: string | null
  address: string | null
  contact_person: string | null
  notes: string | null
  is_active: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  elevator: 'エレベーター',
  fire: '消防設備',
  cleaning: '清掃・管理',
  construction: '建設・修繕',
  electrical: '電気設備',
  water: '給排水',
  parking: '駐車場',
  other: 'その他',
}

const ALL_CATEGORIES = Object.entries(CATEGORY_LABELS)

const BLANK_FORM = {
  name: '',
  categories: [] as string[],
  phone: '',
  email: '',
  address: '',
  contact_person: '',
  notes: '',
}

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [filterCategory, setFilterCategory] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Contractor | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/contractors')
    if (res.ok) setContractors(await res.json())
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditTarget(null)
    setForm(BLANK_FORM)
    setShowModal(true)
  }

  function openEdit(c: Contractor) {
    setEditTarget(c)
    setForm({
      name: c.name,
      categories: c.categories ?? [],
      phone: c.phone ?? '',
      email: c.email ?? '',
      address: c.address ?? '',
      contact_person: c.contact_person ?? '',
      notes: c.notes ?? '',
    })
    setShowModal(true)
  }

  function toggleCategory(cat: string) {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat],
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        ...form,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        contact_person: form.contact_person || null,
        notes: form.notes || null,
      }
      if (editTarget) {
        await fetch(`/api/contractors/${editTarget.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      } else {
        await fetch('/api/contractors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }
      setShowModal(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('この業者を削除しますか？')) return
    await fetch(`/api/contractors/${id}`, { method: 'DELETE' })
    load()
  }

  const filtered = filterCategory
    ? contractors.filter(c => c.categories?.includes(filterCategory))
    : contractors

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">業者管理</h1>
            <p className="text-sm text-slate-500">取引業者の連絡先・カテゴリを一元管理</p>
          </div>
          <button onClick={openNew} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            ＋ 業者を登録
          </button>
        </div>
      </div>

      {/* カテゴリフィルター */}
      <div className="flex flex-wrap gap-2 p-4 sm:px-6">
        <button onClick={() => setFilterCategory('')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${!filterCategory ? 'bg-slate-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          すべて
        </button>
        {ALL_CATEGORIES.map(([key, label]) => (
          <button key={key} onClick={() => setFilterCategory(filterCategory === key ? '' : key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${filterCategory === key ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* 件数 */}
      <p className="px-4 pb-2 text-xs text-slate-400 sm:px-6">{filtered.length}社</p>

      {/* 一覧 */}
      <div className="grid gap-3 px-4 pb-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">
            業者が登録されていません。「業者を登録」から追加してください。
          </div>
        )}
        {filtered.map(c => (
          <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{c.name}</p>
                {c.contact_person && <p className="text-xs text-slate-400">担当: {c.contact_person}</p>}
                <div className="mt-2 flex flex-wrap gap-1">
                  {(c.categories ?? []).map(cat => (
                    <span key={cat} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                      {CATEGORY_LABELS[cat] ?? cat}
                    </span>
                  ))}
                </div>
                <div className="mt-2 space-y-0.5 text-xs text-slate-500">
                  {c.phone && <p><a href={`tel:${c.phone}`} className="text-blue-500 hover:underline">{c.phone}</a></p>}
                  {c.email && <p><a href={`mailto:${c.email}`} className="text-blue-500 hover:underline truncate block">{c.email}</a></p>}
                  {c.address && <p className="truncate">{c.address}</p>}
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
              <button onClick={() => openEdit(c)} className="flex-1 rounded-lg bg-slate-50 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">編集</button>
              <button onClick={() => handleDelete(c.id)} className="flex-1 rounded-lg bg-red-50 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">削除</button>
            </div>
          </div>
        ))}
      </div>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-h-[90vh] sm:rounded-2xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">{editTarget ? '業者を編集' : '業者を登録'}</h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="mb-1 block font-medium text-slate-700">業者名 <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="○○設備株式会社" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">カテゴリ（複数選択可）</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_CATEGORIES.map(([key, label]) => (
                    <button key={key} type="button" onClick={() => toggleCategory(key)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${form.categories.includes(key) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-700">電話番号</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="03-xxxx-xxxx" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">担当者名</label>
                  <input value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))}
                    placeholder="田中 一郎" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">メールアドレス</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="info@example.com" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">住所</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="東京都○○区..." className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">メモ</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">キャンセル</button>
              <button onClick={handleSave} disabled={saving || !form.name}
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
