'use client'

import { useEffect, useState } from 'react'

type Category = { id: string; name: string; display_order: number }

export default function AccountCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/account-categories')
    if (res.ok) setCategories(await res.json())
    setLoading(false)
  }

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    const res = await fetch('/api/account-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), display_order: categories.length }),
    })
    if (res.ok) {
      setNewName('')
      setMessage({ type: 'success', text: '追加しました' })
      await load()
    } else {
      setMessage({ type: 'error', text: '追加に失敗しました' })
    }
    setSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return
    const res = await fetch(`/api/account-categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    })
    if (res.ok) {
      setEditingId(null)
      await load()
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？この勘定科目を使用中の事業計画は「未分類」になります。`)) return
    const res = await fetch(`/api/account-categories/${id}`, { method: 'DELETE' })
    if (res.ok) await load()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">勘定科目の設定</h1>
      <p className="text-sm text-slate-500 mb-8">事業計画進捗管理で使用する勘定科目を登録・管理します。</p>

      {message && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* 追加フォーム */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-700 mb-3">新しい勘定科目を追加</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="例：修繕費、管理委託費、設備費"
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button
            onClick={handleAdd}
            disabled={saving || !newName.trim()}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
          >
            追加
          </button>
        </div>
      </div>

      {/* 一覧 */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">読み込み中...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            勘定科目がまだ登録されていません。<br />上のフォームから追加してください。
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {categories.map(cat => (
              <li key={cat.id} className="flex items-center justify-between px-5 py-3.5">
                {editingId === cat.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleUpdate(cat.id); if (e.key === 'Escape') setEditingId(null) }}
                      autoFocus
                      className="flex-1 rounded-lg border border-blue-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <button onClick={() => handleUpdate(cat.id)} className="text-sm font-medium text-blue-600 hover:underline">保存</button>
                    <button onClick={() => setEditingId(null)} className="text-sm text-slate-400 hover:underline">キャンセル</button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-medium text-slate-800">{cat.name}</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setEditingId(cat.id); setEditName(cat.name) }} className="text-xs text-slate-400 hover:text-slate-600">編集</button>
                      <button onClick={() => handleDelete(cat.id, cat.name)} className="text-xs text-red-400 hover:text-red-600">削除</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  )
}
