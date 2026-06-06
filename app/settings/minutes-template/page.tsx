'use client'

import { useEffect, useRef, useState } from 'react'

type Template = {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

function formatDate(value: string | null) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

export default function MinutesTemplatePage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function fetchTemplates() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai-minutes/templates')
      const json = await res.json()
      setTemplates(json.templates ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !name.trim()) return

    setUploading(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', name.trim())

      const res = await fetch('/api/ai-minutes/templates', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: json.error ?? 'アップロードに失敗しました。' })
        return
      }

      setMessage({ type: 'success', text: 'テンプレートを登録しました。次回の議事録生成からこのフォーマットが使われます。' })
      setName('')
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      await fetchTemplates()
    } finally {
      setUploading(false)
    }
  }

  async function handleSetActive(id: string) {
    await fetch(`/api/ai-minutes/templates/${id}`, { method: 'PATCH' })
    await fetchTemplates()
  }

  async function handleDelete(id: string) {
    if (!confirm('このテンプレートを削除しますか？')) return
    await fetch(`/api/ai-minutes/templates/${id}`, { method: 'DELETE' })
    await fetchTemplates()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-xl font-bold text-slate-900">議事録フォーマット設定</h1>
      <p className="mb-8 text-sm text-slate-500">
        自社の既存議事録PDFをアップロードすると、AIがそのフォーマット・文体を学習します。
        次回以降の議事録生成で自動的に適用されます。
      </p>

      {/* アップロードフォーム */}
      <form onSubmit={handleUpload} className="mb-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-800">新しいテンプレートを登録</h2>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">テンプレート名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 〇〇マンション 総会議事録フォーマット"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </div>

        <div className="mb-5">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            議事録サンプル PDF
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
            required
          />
          <p className="mt-1 text-xs text-slate-400">PDF形式のみ対応。既存の議事録を1件以上アップロードしてください。</p>
        </div>

        {message && (
          <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !file || !name.trim()}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? '解析・登録中...' : 'アップロードして登録'}
        </button>
      </form>

      {/* テンプレート一覧 */}
      <h2 className="mb-3 font-semibold text-slate-800">登録済みテンプレート</h2>

      {loading ? (
        <p className="text-sm text-slate-400">読み込み中...</p>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
          <p className="text-sm text-slate-400">テンプレートがまだ登録されていません。</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {templates.map((t) => (
            <li
              key={t.id}
              className={`flex items-center justify-between rounded-xl border px-5 py-4 ${t.is_active ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'}`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">{t.name}</span>
                  {t.is_active && (
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                      使用中
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-400">登録日: {formatDate(t.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                {!t.is_active && (
                  <button
                    onClick={() => handleSetActive(t.id)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    使用する
                  </button>
                )}
                <button
                  onClick={() => handleDelete(t.id)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
