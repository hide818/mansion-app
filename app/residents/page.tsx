'use client'

import { useState, useEffect, useCallback } from 'react'

type Resident = {
  id: string
  name: string
  name_kana: string | null
  phone: string | null
  email: string | null
  resident_type: 'owner' | 'tenant'
  is_board_member: boolean
  board_role: string | null
  is_active: boolean
  notes: string | null
  units: { unit_number: string; floor: number | null; layout: string | null } | null
  properties: { name: string } | null
}

type Property = { id: string; name: string }
type Unit = { id: string; unit_number: string; floor: number | null; layout: string | null }

type ResidentForm = {
  property_id: string
  unit_id: string
  name: string
  name_kana: string
  phone: string
  email: string
  resident_type: 'owner' | 'tenant'
  is_board_member: boolean
  board_role: string
  notes: string
}

const BLANK_FORM: ResidentForm = {
  property_id: '',
  unit_id: '',
  name: '',
  name_kana: '',
  phone: '',
  email: '',
  resident_type: 'owner',
  is_board_member: false,
  board_role: '',
  notes: '',
}

const BOARD_ROLES = ['理事長', '副理事長', '理事', '監事']

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [filterProperty, setFilterProperty] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Resident | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)

  const loadResidents = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterProperty) params.set('property_id', filterProperty)
    if (search) params.set('search', search)
    const res = await fetch(`/api/residents?${params}`)
    if (res.ok) setResidents(await res.json())
  }, [filterProperty, search])

  useEffect(() => {
    fetch('/api/properties').then(r => r.json()).then(setProperties).catch(() => {})
  }, [])

  useEffect(() => { loadResidents() }, [loadResidents])

  useEffect(() => {
    if (!form.property_id) { setUnits([]); return }
    fetch(`/api/units?property_id=${form.property_id}`)
      .then(r => r.json()).then(setUnits).catch(() => {})
  }, [form.property_id])

  function openNew() {
    setEditTarget(null)
    setForm(BLANK_FORM)
    setShowModal(true)
  }

  function openEdit(r: Resident) {
    setEditTarget(r)
    setForm({
      property_id: '',
      unit_id: r.units ? '' : '',
      name: r.name,
      name_kana: r.name_kana ?? '',
      phone: r.phone ?? '',
      email: r.email ?? '',
      resident_type: r.resident_type,
      is_board_member: r.is_board_member,
      board_role: r.board_role ?? '',
      notes: r.notes ?? '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        ...form,
        property_id: form.property_id || undefined,
        unit_id: form.unit_id || undefined,
        board_role: form.is_board_member ? form.board_role : null,
        name_kana: form.name_kana || null,
        phone: form.phone || null,
        email: form.email || null,
        notes: form.notes || null,
      }
      if (editTarget) {
        await fetch(`/api/residents/${editTarget.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      } else {
        await fetch('/api/residents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }
      setShowModal(false)
      loadResidents()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('この居住者を削除（非表示）にしますか？')) return
    await fetch(`/api/residents/${id}`, { method: 'DELETE' })
    loadResidents()
  }

  const stats = {
    total: residents.length,
    owners: residents.filter(r => r.resident_type === 'owner').length,
    tenants: residents.filter(r => r.resident_type === 'tenant').length,
    board: residents.filter(r => r.is_board_member).length,
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">居住者管理</h1>
            <p className="text-sm text-slate-500">区分所有者・賃借人・理事会メンバーを管理</p>
          </div>
          <button onClick={openNew} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            ＋ 居住者を追加
          </button>
        </div>
      </div>

      {/* サマリ */}
      <div className="grid grid-cols-4 gap-3 p-4 sm:px-6">
        {[
          { label: '総居住者', value: stats.total, color: 'text-slate-700' },
          { label: '区分所有者', value: stats.owners, color: 'text-blue-600' },
          { label: '賃借人', value: stats.tenants, color: 'text-purple-600' },
          { label: '理事会', value: stats.board, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* フィルター・検索 */}
      <div className="flex flex-col gap-2 px-4 pb-3 sm:flex-row sm:px-6">
        <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:max-w-xs">
          <option value="">全物件</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="氏名で検索..."
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
      </div>

      {/* 一覧 */}
      <div className="space-y-2 px-4 pb-6 sm:px-6">
        {residents.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">
            居住者が登録されていません。「居住者を追加」から登録してください。
          </div>
        )}
        {residents.map(r => (
          <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${r.resident_type === 'owner' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                    {r.resident_type === 'owner' ? '区分所有者' : '賃借人'}
                  </span>
                  {r.is_board_member && (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      {r.board_role ?? '理事会'}
                    </span>
                  )}
                </div>
                <p className="mt-1 font-semibold text-slate-900">{r.name}</p>
                {r.name_kana && <p className="text-xs text-slate-400">{r.name_kana}</p>}
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                  {r.units?.unit_number && <span>部屋: {r.units.unit_number}号{r.units.layout ? `（${r.units.layout}）` : ''}</span>}
                  {r.properties?.name && <span>{r.properties.name}</span>}
                  {r.phone && <a href={`tel:${r.phone}`} className="text-blue-500 hover:underline">{r.phone}</a>}
                  {r.email && <a href={`mailto:${r.email}`} className="text-blue-500 hover:underline">{r.email}</a>}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => openEdit(r)} className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">編集</button>
                <button onClick={() => handleDelete(r.id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">削除</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-h-[90vh] sm:rounded-2xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">{editTarget ? '居住者を編集' : '居住者を追加'}</h2>
            <div className="space-y-3 text-sm">
              {!editTarget && (
                <>
                  <div>
                    <label className="mb-1 block font-medium text-slate-700">物件</label>
                    <select value={form.property_id} onChange={e => setForm(f => ({ ...f, property_id: e.target.value, unit_id: '' }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2">
                      <option value="">選択してください</option>
                      {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block font-medium text-slate-700">部屋番号</label>
                    <select value={form.unit_id} onChange={e => setForm(f => ({ ...f, unit_id: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2">
                      <option value="">未設定</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.unit_number}号室</option>)}
                    </select>
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-700">氏名 <span className="text-red-500">*</span></label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="山田 太郎" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">フリガナ</label>
                  <input value={form.name_kana} onChange={e => setForm(f => ({ ...f, name_kana: e.target.value }))}
                    placeholder="ヤマダ タロウ" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-700">電話番号</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="090-xxxx-xxxx" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">メール</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="example@mail.com" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">種別</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="owner" checked={form.resident_type === 'owner'} onChange={() => setForm(f => ({ ...f, resident_type: 'owner' }))} />
                    区分所有者
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="tenant" checked={form.resident_type === 'tenant'} onChange={() => setForm(f => ({ ...f, resident_type: 'tenant' }))} />
                    賃借人
                  </label>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_board_member} onChange={e => setForm(f => ({ ...f, is_board_member: e.target.checked }))} />
                  <span className="font-medium text-slate-700">理事会メンバー</span>
                </label>
              </div>
              {form.is_board_member && (
                <div>
                  <label className="mb-1 block font-medium text-slate-700">役職</label>
                  <select value={form.board_role} onChange={e => setForm(f => ({ ...f, board_role: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2">
                    <option value="">役職なし（理事）</option>
                    {BOARD_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}
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
