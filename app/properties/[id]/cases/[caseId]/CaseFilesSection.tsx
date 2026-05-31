'use client'

import { useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type CaseFileRow = {
  id: string
  file_name: string | null
  file_url: string | null
  file_type: string | null
  category: string | null
  note: string | null
  created_at: string | null
  file_path: string | null
}

type CaseFilesSectionProps = {
  caseId: string
  propertyId: string
  companyId: string
  initialFiles: CaseFileRow[]
}

function formatDateTime(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getCategoryLabel(value: string | null) {
  switch (value) {
    case 'estimate':
      return '見積書'
    case 'photo':
      return '現地写真'
    case 'report':
      return '報告書'
    case 'drawing':
      return '図面'
    default:
      return 'その他'
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message
  }

  return '不明なエラー'
}

function getSafeExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf('.')
  if (lastDotIndex === -1) return ''

  const ext = fileName.slice(lastDotIndex + 1).toLowerCase()
  return ext.replace(/[^a-z0-9]/g, '')
}

function buildSafeStorageFileName(originalFileName: string) {
  const ext = getSafeExtension(originalFileName)
  const randomPart = Math.random().toString(36).slice(2, 10)
  const timestamp = Date.now()

  if (ext) {
    return `${timestamp}_${randomPart}.${ext}`
  }

  return `${timestamp}_${randomPart}`
}

export default function CaseFilesSection({
  caseId,
  propertyId,
  companyId,
  initialFiles,
}: CaseFilesSectionProps) {
  const [files, setFiles] = useState<CaseFileRow[]>(initialFiles)
  const [category, setCategory] = useState('other')
  const [note, setNote] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
      return bTime - aTime
    })
  }, [files])

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedFile) {
      alert('先にファイルを選んでください。')
      return
    }

    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (!allowed.includes(selectedFile.type)) {
      alert('PDF、JPG、PNG、WEBP のみアップロードできます。')
      return
    }

    setIsUploading(true)
    setMessage('')

    try {
      const safeStorageFileName = buildSafeStorageFileName(selectedFile.name)

      const filePath = `${companyId}/${propertyId}/${caseId}/${safeStorageFileName}`

      const { error: uploadError } = await supabase.storage
        .from('case-files')
        .upload(filePath, selectedFile, {
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: publicUrlData } = supabase.storage
        .from('case-files')
        .getPublicUrl(filePath)

      const fileUrl = publicUrlData.publicUrl

      const { data: inserted, error: insertError } = await supabase
        .from('case_files')
        .insert({
          case_id: caseId,
          property_id: propertyId,
          company_id: companyId,
          file_name: selectedFile.name,
          file_path: filePath,
          file_url: fileUrl,
          file_type: selectedFile.type,
          category,
          note: note.trim() || null,
        })
        .select(
          'id, file_name, file_url, file_type, category, note, created_at, file_path'
        )
        .single()

      if (insertError) {
        throw insertError
      }

      setFiles((prev) => [inserted as CaseFileRow, ...prev])
      setSelectedFile(null)
      setCategory('other')
      setNote('')
      setMessage('アップロードできました。')

      const fileInput = document.getElementById(
        'case-file-input'
      ) as HTMLInputElement | null

      if (fileInput) {
        fileInput.value = ''
      }
    } catch (error) {
      console.error(error)
      alert(`アップロードに失敗しました。\n${getErrorMessage(error)}`)
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDelete(file: CaseFileRow) {
    if (!file.id) return

    const ok = window.confirm(`「${file.file_name ?? 'この資料'}」を削除しますか？`)
    if (!ok) return

    setDeletingId(file.id)
    setMessage('')

    try {
      if (file.file_path) {
        const { error: storageError } = await supabase.storage
          .from('case-files')
          .remove([file.file_path])

        if (storageError) {
          throw storageError
        }
      }

      const { error: deleteError } = await supabase
        .from('case_files')
        .delete()
        .eq('id', file.id)

      if (deleteError) {
        throw deleteError
      }

      setFiles((prev) => prev.filter((item) => item.id !== file.id))
      setMessage('削除できました。')
    } catch (error) {
      console.error(error)
      alert(`削除に失敗しました。\n${getErrorMessage(error)}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-bold">添付資料</h2>
        <p className="mt-1 text-sm text-slate-500">
          見積書や現地写真を案件に紐づけて保存します。上程文の添付資料にも流用できます。
        </p>
      </div>

      <form
        onSubmit={handleUpload}
        className="rounded-2xl border bg-slate-50 p-4"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              資料区分
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
            >
              <option value="estimate">見積書</option>
              <option value="photo">現地写真</option>
              <option value="report">報告書</option>
              <option value="drawing">図面</option>
              <option value="other">その他</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              補足メモ
            </label>
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="例: 1社目見積、3/21受領分"
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            ファイル
          </label>
          <input
            id="case-file-input"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              setSelectedFile(file)
            }}
            className="block w-full text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">
            PDF、JPG、PNG、WEBP をアップロードできます。
          </p>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={isUploading}
            className="inline-flex min-w-[64px] items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium !text-white hover:opacity-90 disabled:opacity-50"
          >
            {isUploading ? 'アップロード中...' : '資料を追加'}
          </button>

          {message ? (
            <span className="text-sm text-emerald-700">{message}</span>
          ) : null}
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {sortedFiles.length === 0 ? (
          <p className="text-sm text-slate-500">まだ添付資料はありません。</p>
        ) : (
          sortedFiles.map((file) => (
            <div key={file.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="font-medium text-slate-900">
                    {file.file_name ?? '無題ファイル'}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                      区分: {getCategoryLabel(file.category)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                      登録日: {formatDateTime(file.created_at)}
                    </span>
                  </div>

                  {file.note ? (
                    <p className="text-sm text-slate-600">メモ: {file.note}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {file.file_url ? (
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
                    >
                      開く
                    </a>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => handleDelete(file)}
                    disabled={deletingId === file.id}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === file.id ? '削除中...' : '削除'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}