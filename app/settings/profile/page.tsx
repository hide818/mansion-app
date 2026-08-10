'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'

export default function ProfileSettingsPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setEmail(user.email ?? '')
      const { data } = await supabase.from('profiles').select('display_name').eq('id', user.id).single()
      setDisplayName(data?.display_name ?? '')
      setLoading(false)
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) return
    setSaving(true)
    setMessage('')
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: displayName.trim() }),
    })
    setSaving(false)
    if (res.ok) {
      setMessage('保存しました')
    } else {
      const d = await res.json()
      setMessage(d.error ?? '保存に失敗しました')
    }
  }

  if (loading) return <div className="p-6 text-sm text-slate-500">読み込み中…</div>

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">設定</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">プロフィール</h1>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm max-w-md">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">メールアドレス</label>
            <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">{email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              表示名 <span className="text-xs text-slate-400">（ダッシュボードの挨拶に表示されます）</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="例：小松"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              required
            />
          </div>
          {message && (
            <p className={`text-sm ${message === '保存しました' ? 'text-emerald-600' : 'text-red-600'}`}>{message}</p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中…' : '保存する'}
          </button>
        </form>
      </section>
    </div>
  )
}
