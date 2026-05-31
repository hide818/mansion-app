'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type StaffMember = {
  id: string
  name: string
  display_order: number
  created_at: string
}

type GetResponse = { members: StaffMember[] } | { error: string }
type PostResponse = { member: StaffMember } | { error: string }
type PatchResponse = { success: true } | { error: string }

export default function MinutesStaffPage() {
  const [members, setMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    void fetchMembers()
  }, [])

  async function fetchMembers() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/settings/minutes-staff', { cache: 'no-store' })
      const data = (await res.json()) as GetResponse
      if (!res.ok || 'error' in data) {
        setError('error' in data ? data.error : '担当者一覧の取得に失敗しました。')
        return
      }
      setMembers(data.members)
    } catch {
      setError('担当者一覧の取得中に通信エラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) {
      setError('担当者名を入力してください。')
      return
    }
    setAdding(true)
    setError('')
    setSuccessMessage('')
    try {
      const res = await fetch('/api/settings/minutes-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const data = (await res.json()) as PostResponse
      if (!res.ok || 'error' in data) {
        setError('error' in data ? data.error : '担当者の追加に失敗しました。')
        return
      }
      setNewName('')
      setSuccessMessage(`「${trimmed}」を追加しました。`)
      setMembers((prev) => [...prev, data.member])
    } catch {
      setError('担当者追加中に通信エラーが発生しました。')
    } finally {
      setAdding(false)
    }
  }

  async function handleDeactivate(id: string, name: string) {
    if (!window.confirm(`「${name}」を無効化しますか？\nAI議事録の担当者候補から除外されます。`)) return
    setDeactivatingId(id)
    setError('')
    setSuccessMessage('')
    try {
      const res = await fetch(`/api/settings/minutes-staff/${id}`, {
        method: 'PATCH',
      })
      const data = (await res.json()) as PatchResponse
      if (!res.ok || 'error' in data) {
        setError('error' in data ? data.error : '無効化に失敗しました。')
        return
      }
      setSuccessMessage(`「${name}」を無効化しました。`)
      setMembers((prev) => prev.filter((m) => m.id !== id))
    } catch {
      setError('無効化中に通信エラーが発生しました。')
    } finally {
      setDeactivatingId(null)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-emerald-600">設定</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">議事録担当者設定</h1>
        <p className="mt-2 text-sm text-slate-600">
          AI議事録作成画面で選択できる担当者を登録・管理します。
        </p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">担当者を追加</h2>
        <form onSubmit={handleAdd} className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="担当者名を入力"
            disabled={adding}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-white"
          >
            {adding ? '追加中...' : '追加'}
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">登録済み担当者</h2>
        {loading ? (
          <p className="text-sm text-slate-400">読み込み中...</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-slate-400">担当者が登録されていません。</p>
        ) : (
          <ul className="space-y-3">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
              >
                <span className="text-sm font-medium text-slate-800">{member.name}</span>
                <button
                  type="button"
                  onClick={() => void handleDeactivate(member.id, member.name)}
                  disabled={deactivatingId === member.id}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:border-red-400 hover:text-red-600 disabled:opacity-50"
                >
                  {deactivatingId === member.id ? '処理中...' : '無効化'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="text-sm">
        <Link href="/ai-minutes" className="text-emerald-600 hover:underline">
          AI議事録作成画面へ戻る
        </Link>
      </div>
    </div>
  )
}
