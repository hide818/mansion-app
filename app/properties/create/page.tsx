'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function PropertyCreatePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [totalUnits, setTotalUnits] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('物件名を入力してください'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), address: address.trim(), total_units: totalUnits || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '登録に失敗しました'); return }
      router.push('/ai-minutes')
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center pt-12 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-1">物件登録</p>
          <h1 className="text-2xl font-bold text-slate-900 mb-6">マンション情報を追加</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                物件名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="例：グリーンヒルズ新宿"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">住所</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="例：東京都新宿区西新宿1-1-1"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">総戸数</label>
              <input
                type="number"
                value={totalUnits}
                onChange={e => setTotalUnits(e.target.value)}
                placeholder="例：48"
                min={1}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {loading ? '登録中…' : '登録してAI議事録へ →'}
            </button>
          </form>

          <p className="mt-4 text-xs text-slate-400 text-center">
            登録後、AI議事録で物件を選択して利用できます
          </p>
        </div>
      </div>
    </div>
  )
}
