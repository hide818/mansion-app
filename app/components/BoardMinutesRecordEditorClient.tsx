'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  formatDateTime,
  getMeetingTypeLabel,
  type BoardMinutesRecord,
  type BoardMinutesRecordStatus,
  type MeetingType,
} from '@/lib/boardMinutesRecords'

type BoardMinutesRecordEditorClientProps = {
  propertyId: string
  caseId: string
  recordId: string
}

type EditorFormState = {
  meetingType: MeetingType
  meetingName: string
  transcriptText: string
  minutesText: string
  supplementNote: string
  status: BoardMinutesRecordStatus
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildPlainTextDocument(form: EditorFormState, record: BoardMinutesRecord) {
  const lines = [
    `会議種別: ${getMeetingTypeLabel(form.meetingType)}`,
    `会議名: ${form.meetingName.trim() || '会議名未設定'}`,
    `状態: ${form.status === 'final' ? '確定' : '下書き'}`,
    `作成日: ${formatDateTime(record.created_at)}`,
    `更新日: ${formatDateTime(record.updated_at)}`,
    '',
    '【議事録本文】',
    form.minutesText.trim(),
  ]

  if (form.supplementNote.trim()) {
    lines.push('', '【補足メモ】', form.supplementNote.trim())
  }

  if (form.transcriptText.trim()) {
    lines.push('', '【文字起こし全文】', form.transcriptText.trim())
  }

  return lines.join('\n')
}

function buildWordHtmlDocument(form: EditorFormState, record: BoardMinutesRecord) {
  const meetingTypeLabel = getMeetingTypeLabel(form.meetingType)
  const meetingName = form.meetingName.trim() || '会議名未設定'
  const statusLabel = form.status === 'final' ? '確定' : '下書き'
  const minutesText = escapeHtml(form.minutesText).replaceAll('\n', '<br />')
  const supplementNote = escapeHtml(form.supplementNote).replaceAll('\n', '<br />')
  const transcriptText = escapeHtml(form.transcriptText).replaceAll('\n', '<br />')

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(meetingName)}</title>
<style>
  body {
    font-family: "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif;
    line-height: 1.8;
    color: #111827;
    padding: 32px;
  }
  h1 {
    font-size: 24px;
    margin: 0 0 8px 0;
  }
  .meta {
    margin-bottom: 24px;
    font-size: 14px;
    color: #4b5563;
  }
  .section-title {
    font-weight: bold;
    margin: 24px 0 8px 0;
    font-size: 16px;
  }
  .box {
    white-space: normal;
    border: 1px solid #d1d5db;
    border-radius: 12px;
    padding: 16px;
  }
</style>
</head>
<body>
  <h1>${escapeHtml(meetingName)}</h1>
  <div class="meta">
    <div>会議種別: ${escapeHtml(meetingTypeLabel)}</div>
    <div>状態: ${escapeHtml(statusLabel)}</div>
    <div>作成日: ${escapeHtml(formatDateTime(record.created_at))}</div>
    <div>更新日: ${escapeHtml(formatDateTime(record.updated_at))}</div>
  </div>

  <div class="section-title">議事録本文</div>
  <div class="box">${minutesText}</div>

  ${
    form.supplementNote.trim()
      ? `
  <div class="section-title">補足メモ</div>
  <div class="box">${supplementNote}</div>
  `
      : ''
  }

  ${
    form.transcriptText.trim()
      ? `
  <div class="section-title">文字起こし全文</div>
  <div class="box">${transcriptText}</div>
  `
      : ''
  }
</body>
</html>`
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export default function BoardMinutesRecordEditorClient({
  propertyId,
  caseId,
  recordId,
}: BoardMinutesRecordEditorClientProps) {
  const router = useRouter()

  const [record, setRecord] = useState<BoardMinutesRecord | null>(null)
  const [form, setForm] = useState<EditorFormState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const apiPath = useMemo(() => {
    return `/api/properties/${propertyId}/cases/${caseId}/board-minutes-records/${recordId}`
  }, [propertyId, caseId, recordId])

  const listApiPath = useMemo(() => {
    return `/api/properties/${propertyId}/cases/${caseId}/board-minutes-records`
  }, [propertyId, caseId])

  async function loadRecord() {
    setIsLoading(true)
    setErrorMessage('')
    setMessage('')

    try {
      const response = await fetch(apiPath, {
        cache: 'no-store',
      })
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.error ?? '保存済み議事録の取得に失敗しました。')
      }

      const nextRecord = json.record as BoardMinutesRecord
      setRecord(nextRecord)
      setForm({
        meetingType: nextRecord.meeting_type,
        meetingName: nextRecord.meeting_name ?? '',
        transcriptText: nextRecord.transcript_text ?? '',
        minutesText: nextRecord.minutes_text ?? '',
        supplementNote: nextRecord.supplement_note ?? '',
        status: nextRecord.status,
      })
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '保存済み議事録の取得に失敗しました。'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadRecord()
  }, [apiPath])

  async function handleSave() {
    if (!form) return

    if (!form.minutesText.trim()) {
      setErrorMessage('議事録本文を入れてください。')
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    setMessage('')

    try {
      const response = await fetch(apiPath, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.error ?? '議事録の更新に失敗しました。')
      }

      const updatedRecord = json.record as BoardMinutesRecord

      setRecord(updatedRecord)
      setForm({
        meetingType: updatedRecord.meeting_type,
        meetingName: updatedRecord.meeting_name ?? '',
        transcriptText: updatedRecord.transcript_text ?? '',
        minutesText: updatedRecord.minutes_text ?? '',
        supplementNote: updatedRecord.supplement_note ?? '',
        status: updatedRecord.status,
      })
      setMessage('保存しました。')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '議事録の更新に失敗しました。'
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('この議事録を削除します。よろしいですか？')) {
      return
    }

    setIsDeleting(true)
    setErrorMessage('')
    setMessage('')

    try {
      const response = await fetch(apiPath, {
        method: 'DELETE',
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.error ?? '議事録の削除に失敗しました。')
      }

      router.push(
        `/properties/${propertyId}/cases/${caseId}/board-minutes-records`
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '議事録の削除に失敗しました。'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleDuplicate() {
    if (!form || !record) {
      setErrorMessage('複製元の議事録が読み込めていません。')
      return
    }

    if (!form.minutesText.trim()) {
      setErrorMessage('複製する議事録本文がありません。')
      return
    }

    setIsDuplicating(true)
    setErrorMessage('')
    setMessage('')

    try {
      const duplicatedMeetingName = form.meetingName.trim()
        ? `${form.meetingName.trim()}（複製）`
        : '会議名未設定（複製）'

      const response = await fetch(listApiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingType: form.meetingType,
          meetingName: duplicatedMeetingName,
          transcriptText: form.transcriptText,
          minutesText: form.minutesText,
          supplementNote: form.supplementNote,
          formattingOptions: record.formatting_options ?? null,
          status: 'draft',
        }),
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.error ?? '議事録の複製に失敗しました。')
      }

      const newRecordId = json.record?.id as string | undefined

      if (!newRecordId) {
        throw new Error('複製はできましたが、新しい議事録IDを取得できませんでした。')
      }

      router.push(
        `/properties/${propertyId}/cases/${caseId}/board-minutes-records/${newRecordId}`
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '議事録の複製に失敗しました。'
      )
    } finally {
      setIsDuplicating(false)
    }
  }

  async function handleCopy() {
    if (!form?.minutesText.trim()) {
      setErrorMessage('コピーする議事録本文がありません。')
      return
    }

    try {
      await navigator.clipboard.writeText(form.minutesText)
      setMessage('議事録本文をコピーしました。')
      setErrorMessage('')
    } catch {
      setErrorMessage('コピーに失敗しました。')
    }
  }

  function handleDownloadTxt() {
    if (!form || !record || !form.minutesText.trim()) {
      setErrorMessage('保存する議事録本文がありません。')
      return
    }

    const meetingName = form.meetingName.trim() || '会議名未設定'
    const text = buildPlainTextDocument(form, record)
    const blob = new Blob(['\uFEFF', text], {
      type: 'text/plain;charset=utf-8',
    })

    downloadBlob(blob, `${meetingName}.txt`)
    setMessage('TXTで保存しました。')
    setErrorMessage('')
  }

  function handleDownloadWord() {
    if (!form || !record || !form.minutesText.trim()) {
      setErrorMessage('保存する議事録本文がありません。')
      return
    }

    const meetingName = form.meetingName.trim() || '会議名未設定'
    const html = buildWordHtmlDocument(form, record)
    const blob = new Blob(['\uFEFF', html], {
      type: 'application/msword;charset=utf-8',
    })

    downloadBlob(blob, `${meetingName}.doc`)
    setMessage('Word形式で保存しました。')
    setErrorMessage('')
  }

  function handlePrint() {
    if (!form || !record || !form.minutesText.trim()) {
      setErrorMessage('印刷する議事録本文がありません。')
      return
    }

    const printWindow = window.open('', '_blank', 'noopener,noreferrer')

    if (!printWindow) {
      setErrorMessage('印刷ウィンドウを開けませんでした。')
      return
    }

    const html = buildWordHtmlDocument(form, record)

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()

    window.setTimeout(() => {
      printWindow.print()
    }, 300)

    setMessage('印刷画面を開きました。')
    setErrorMessage('')
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">読み込み中です…</p>
      </div>
    )
  }

  if (!record || !form) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm text-red-700">
            {errorMessage || '保存済み議事録が見つかりません。'}
          </p>
        </div>
        <Link
          href={`/properties/${propertyId}/cases/${caseId}/board-minutes-records`}
          className="inline-flex rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          一覧へ戻る
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                {getMeetingTypeLabel(record.meeting_type)}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  record.status === 'final'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {record.status === 'final' ? '確定' : '下書き'}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-bold text-gray-900">
              {record.meeting_name || '会議名未設定'}
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              作成日：{formatDateTime(record.created_at)}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              更新日：{formatDateTime(record.updated_at)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/properties/${propertyId}/cases/${caseId}/board-minutes-records`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              一覧へ戻る
            </Link>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              本文をコピー
            </button>
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              TXT保存
            </button>
            <button
              type="button"
              onClick={handleDownloadWord}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Word保存
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              印刷
            </button>
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className="rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDuplicating ? '複製中…' : '複製して別案を作る'}
            </button>
          </div>
        </div>
      </div>

      {message ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">会議種別</span>
            <select
              value={form.meetingType}
              onChange={(event) =>
                setForm((current) =>
                  current
                    ? {
                        ...current,
                        meetingType: event.target.value as MeetingType,
                      }
                    : current
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="board">理事会</option>
              <option value="general">総会</option>
              <option value="meeting">打合せ</option>
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-gray-700">会議名</span>
            <input
              value={form.meetingName}
              onChange={(event) =>
                setForm((current) =>
                  current
                    ? {
                        ...current,
                        meetingName: event.target.value,
                      }
                    : current
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <label className="mt-4 block space-y-2">
          <span className="text-sm font-medium text-gray-700">文字起こし全文</span>
          <textarea
            value={form.transcriptText}
            onChange={(event) =>
              setForm((current) =>
                current
                  ? {
                      ...current,
                      transcriptText: event.target.value,
                    }
                  : current
              )
            }
            rows={10}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="mt-4 block space-y-2">
          <span className="text-sm font-medium text-gray-700">議事録本文</span>
          <textarea
            value={form.minutesText}
            onChange={(event) =>
              setForm((current) =>
                current
                  ? {
                      ...current,
                      minutesText: event.target.value,
                    }
                  : current
              )
            }
            rows={16}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="mt-4 block space-y-2">
          <span className="text-sm font-medium text-gray-700">補足メモ</span>
          <textarea
            value={form.supplementNote}
            onChange={(event) =>
              setForm((current) =>
                current
                  ? {
                      ...current,
                      supplementNote: event.target.value,
                    }
                  : current
              )
            }
            rows={5}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="mt-4 block space-y-2">
          <span className="text-sm font-medium text-gray-700">状態</span>
          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) =>
                current
                  ? {
                      ...current,
                      status: event.target.value as BoardMinutesRecordStatus,
                    }
                  : current
              )
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm md:w-56"
          >
            <option value="draft">下書き</option>
            <option value="final">確定</option>
          </select>
        </label>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? '保存中…' : '更新して保存'}
          </button>

          <button
            type="button"
            onClick={() => void loadRecord()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            最新状態を再読み込み
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? '削除中…' : '削除'}
          </button>
        </div>
      </div>
    </div>
  )
}