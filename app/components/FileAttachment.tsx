'use client'

import { useRef, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'

const BUCKET = 'kura-files'
const MAX_MB = 20

type Props = {
  companyId: string
  folder: string        // e.g. "estimates/abc123" or "inspections/def456"
  filePath: string | null
  fileName: string | null
  onSaved: (filePath: string, fileName: string) => void
  onDeleted: () => void
}

export default function FileAttachment({ companyId, folder, filePath, fileName, onSaved, onDeleted }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createSupabaseBrowserClient()

  async function handleUpload(file: File) {
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`${MAX_MB}MB以下のファイルを選択してください`)
      return
    }
    setUploading(true)
    setError(null)
    const ext = file.name.split('.').pop()
    const path = `${companyId}/${folder}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
    if (upErr) {
      setError(upErr.message)
      setUploading(false)
      return
    }
    // 古いファイルを削除
    if (filePath) {
      await fetch(`/api/storage/signed-url?path=${encodeURIComponent(filePath)}`, { method: 'DELETE' })
    }
    onSaved(path, file.name)
    setUploading(false)
  }

  async function handleDownload() {
    if (!filePath) return
    const res = await fetch(`/api/storage/signed-url?path=${encodeURIComponent(filePath)}`)
    if (!res.ok) { setError('ダウンロードURLの取得に失敗しました'); return }
    const { url } = await res.json()
    window.open(url, '_blank')
  }

  async function handleDelete() {
    if (!filePath || !confirm('添付ファイルを削除しますか？')) return
    await fetch(`/api/storage/signed-url?path=${encodeURIComponent(filePath)}`, { method: 'DELETE' })
    onDeleted()
  }

  if (filePath && fileName) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <svg className="h-4 w-4 shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M15.172 7l-6.586 6.586a2 2 0 002.828 2.828L18 9.828a4 4 0 00-5.656-5.656L5.757 10.76a6 6 0 008.486 8.485L21 12" />
        </svg>
        <button onClick={handleDownload} className="min-w-0 flex-1 truncate text-left text-sm text-blue-600 hover:underline">
          {fileName}
        </button>
        <button onClick={() => inputRef.current?.click()} className="shrink-0 text-xs text-slate-400 hover:text-slate-600">差替</button>
        <button onClick={handleDelete} className="shrink-0 text-xs text-red-400 hover:text-red-600">削除</button>
        <input ref={inputRef} type="file" className="hidden"
          accept=".pdf,.xls,.xlsx,.doc,.docx,.png,.jpg,.jpeg"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => inputRef.current?.click()} disabled={uploading}
        className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 transition w-full">
        {uploading ? (
          <><div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" /><span>アップロード中...</span></>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M15.172 7l-6.586 6.586a2 2 0 002.828 2.828L18 9.828a4 4 0 00-5.656-5.656L5.757 10.76a6 6 0 008.486 8.485L21 12" />
            </svg>
            <span>PDF / Excel / 画像を添付（最大{MAX_MB}MB）</span>
          </>
        )}
      </button>
      <input ref={inputRef} type="file" className="hidden"
        accept=".pdf,.xls,.xlsx,.doc,.docx,.png,.jpg,.jpeg"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = '' }} />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
