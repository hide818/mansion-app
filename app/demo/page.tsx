'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DemoPage() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(d => {
      if (!d.isAdmin) router.replace('/dashboard')
    }).catch(() => router.replace('/dashboard'))
  }, [router])

  async function handleInsert() {
    if (!confirm('サンプルデータを投入します。既存データは削除されません。続けますか？')) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/demo', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? '失敗しました')
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラー')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <h1 className="text-xl font-bold text-slate-900">デモデータ投入</h1>
        <p className="text-sm text-slate-500">営業デモ・動作確認用のサンプルデータを一括作成します</p>
      </div>

      <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        {done ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
            <div className="mb-3 flex justify-center">
              <svg className="h-10 w-10 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-lg font-bold text-green-800">サンプルデータを投入しました</p>
            <p className="mt-2 text-sm text-green-600">以下のデータが作成されました</p>
            <ul className="mt-4 space-y-1 text-sm text-green-700 text-left mx-auto max-w-xs">
              <li>• 物件 3件（新宿・渋谷・品川）</li>
              <li>• 業者 4社</li>
              <li>• 戸室 10戸</li>
              <li>• 居住者 8名</li>
              <li>• 法定点検 7件（期限超過・今月中を含む）</li>
              <li>• 修繕履歴 4件</li>
              <li>• 管理費支払い 6戸分（一部未払い）</li>
              <li>• 案件 3件・タスク 4件</li>
              <li>• 居住者問い合わせ 3件</li>
            </ul>
            <div className="mt-6 flex flex-col gap-2">
              <button onClick={() => router.push('/dashboard')} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
                ダッシュボードを確認する
              </button>
              <button onClick={() => router.push('/payments')} className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                管理費督促を確認する
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <div className="mb-6 flex justify-center">
              <svg className="h-10 w-10 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
            </div>
            <h2 className="text-center text-lg font-bold text-slate-800 mb-2">サンプルデータ一括投入</h2>
            <p className="text-center text-sm text-slate-500 mb-6">
              Kuraの全機能を体験できるサンプルデータを自動作成します。<br />
              既存データは削除されません。
            </p>

            <div className="rounded-xl bg-slate-50 p-4 mb-6 text-sm text-slate-600 space-y-1">
              <p className="font-semibold text-slate-700 mb-2">作成されるデータ</p>
              <p>物件 3件（新宿・渋谷・品川）</p>
              <p>業者 4社</p>
              <p>居住者 8名</p>
              <p>法定点検 7件（期限超過あり）</p>
              <p>管理費データ 6戸分（未払い2戸）</p>
              <p>案件 3件・タスク 4件</p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button onClick={handleInsert} disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  投入中...
                </span>
              ) : 'サンプルデータを投入する'}
            </button>
            <p className="mt-3 text-center text-xs text-slate-400">※ 本番運用前に削除することをお勧めします</p>
          </div>
        )}
      </div>
    </div>
  )
}
