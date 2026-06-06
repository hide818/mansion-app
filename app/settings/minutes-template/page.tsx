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
  return new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

export default function MinutesTemplatePage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [inputMode, setInputMode] = useState<'pdf' | 'text'>('pdf')
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [rawText, setRawText] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [previewText, setPreviewText] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
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

  useEffect(() => { fetchTemplates() }, [])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    if (inputMode === 'pdf' && !file) return
    if (inputMode === 'text' && !rawText.trim()) return

    setUploading(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      if (inputMode === 'pdf' && file) {
        formData.append('file', file)
      } else {
        formData.append('rawText', rawText.trim())
      }

      const res = await fetch('/api/ai-minutes/templates', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: json.error ?? 'アップロードに失敗しました。' })
        return
      }

      setMessage({ type: 'success', text: 'テンプレートを登録しました。次回の議事録生成からこのフォーマットが使われます。' })
      setName('')
      setFile(null)
      setRawText('')
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
    if (previewId === id) { setPreviewId(null); setPreviewText(null) }
    await fetchTemplates()
  }

  async function handlePreview(id: string) {
    if (previewId === id) { setPreviewId(null); setPreviewText(null); return }
    setPreviewId(id)
    setPreviewLoading(true)
    setPreviewText(null)
    try {
      const res = await fetch(`/api/ai-minutes/templates/${id}`)
      const json = await res.json()
      setPreviewText(json.template?.sample_text ?? '（テキストなし）')
    } finally {
      setPreviewLoading(false)
    }
  }

  const canSubmit = name.trim() && (
    (inputMode === 'pdf' && !!file) ||
    (inputMode === 'text' && rawText.trim().length >= 10)
  )

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-xl font-bold text-slate-900">議事録フォーマット設定</h1>
      <p className="mb-2 text-sm text-slate-500">
        自社の議事録フォーマットを登録すると、AIがそのスタイル・文体・構成を学習します。
      </p>

      {/* なぜ重要か */}
      <div className="mb-8 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <p className="font-semibold mb-1">フォーマット設定が重要な理由</p>
        <p>管理会社・管理組合によって議事録の様式は大きく異なります。フォーマットを登録することで、AIが御社のスタイルに合わせた議事録を自動生成します。</p>
      </div>

      {/* アップロードフォーム */}
      <form onSubmit={handleUpload} className="mb-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-800">新しいテンプレートを登録</h2>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">テンプレート名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: ○○マンション 総会議事録フォーマット"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </div>

        {/* 入力方法タブ */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">登録方法</label>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden w-fit">
            <button
              type="button"
              onClick={() => setInputMode('pdf')}
              className={`px-4 py-2 text-sm font-medium transition ${inputMode === 'pdf' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              PDFアップロード
            </button>
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`px-4 py-2 text-sm font-medium transition ${inputMode === 'text' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              テキスト直接入力
            </button>
          </div>
        </div>

        {inputMode === 'pdf' ? (
          <div className="mb-5">
            <label className="mb-1 block text-sm font-medium text-slate-700">議事録サンプル PDF</label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
              required={inputMode === 'pdf'}
            />
            <p className="mt-1 text-xs text-slate-400">PDF形式のみ対応。既存の議事録を1件アップロードしてください。</p>
          </div>
        ) : (
          <div className="mb-5">
            <label className="mb-1 block text-sm font-medium text-slate-700">フォーマット例・書式ルール</label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={10}
              placeholder={`議事録のフォーマット例をそのまま貼り付けてください。\n\n例：\n第1号議案 収支報告について\n前期の収支は総額〇〇円となった。管理費収入〇〇円、修繕積立金収入〇〇円。\n本議案について承認を諮ったところ、賛成多数で承認された。\n\n第2号議案 予算案について\n...`}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-y"
              required={inputMode === 'text'}
            />
            <p className="mt-1 text-xs text-slate-400">最低10文字以上。既存の議事録をコピー&ペーストするのが最も効果的です（最大4,000文字）。</p>
          </div>
        )}

        {message && (
          <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !canSubmit}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? '解析・登録中...' : '登録する'}
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
            <li key={t.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className={`flex items-center justify-between px-5 py-4 ${t.is_active ? 'bg-blue-50' : ''}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">{t.name}</span>
                    {t.is_active && (
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">使用中</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">登録日: {formatDate(t.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePreview(t.id)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
                  >
                    {previewId === t.id ? '閉じる' : 'プレビュー'}
                  </button>
                  {!t.is_active && (
                    <button
                      onClick={() => handleSetActive(t.id)}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
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
              </div>

              {/* プレビューパネル */}
              {previewId === t.id && (
                <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                  <p className="mb-2 text-xs font-semibold text-slate-500">登録済みフォーマットテキスト</p>
                  {previewLoading ? (
                    <p className="text-xs text-slate-400">読み込み中...</p>
                  ) : (
                    <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 font-mono max-h-48 overflow-y-auto">
                      {previewText}
                    </pre>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
