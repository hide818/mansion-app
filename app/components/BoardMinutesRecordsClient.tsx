'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  formatDateTime,
  getMeetingTypeLabel,
  type BoardMinutesRecord,
  type BoardMinutesRecordStatus,
  type MeetingType,
} from '@/lib/boardMinutesRecords'

type BoardMinutesRecordsClientProps = {
  propertyId: string
  caseId: string
}

type CreateFormState = {
  meetingType: MeetingType
  meetingName: string
  transcriptText: string
  minutesText: string
  supplementNote: string
}

type SearchFilters = {
  query: string
  meetingType: '' | MeetingType
  status: '' | BoardMinutesRecordStatus
}

type SortOption =
  | 'updated_desc'
  | 'updated_asc'
  | 'meeting_name_asc'
  | 'meeting_name_desc'
  | 'status'

const initialFormState: CreateFormState = {
  meetingType: 'board',
  meetingName: '',
  transcriptText: '',
  minutesText: '',
  supplementNote: '',
}

const initialSearchFilters: SearchFilters = {
  query: '',
  meetingType: '',
  status: '',
}

function getStatusLabel(status: BoardMinutesRecordStatus) {
  return status === 'final' ? '確定' : '下書き'
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildPlainTextDocument(record: BoardMinutesRecord) {
  const lines = [
    `会議種別: ${getMeetingTypeLabel(record.meeting_type)}`,
    `会議名: ${record.meeting_name?.trim() || '会議名未設定'}`,
    `状態: ${record.status === 'final' ? '確定' : '下書き'}`,
    `作成日: ${formatDateTime(record.created_at)}`,
    `更新日: ${formatDateTime(record.updated_at)}`,
    '',
    '【議事録本文】',
    record.minutes_text.trim(),
  ]

  if (record.supplement_note?.trim()) {
    lines.push('', '【補足メモ】', record.supplement_note.trim())
  }

  if (record.transcript_text?.trim()) {
    lines.push('', '【文字起こし全文】', record.transcript_text.trim())
  }

  return lines.join('\n')
}

function buildWordHtmlDocument(record: BoardMinutesRecord) {
  const meetingTypeLabel = getMeetingTypeLabel(record.meeting_type)
  const meetingName = record.meeting_name?.trim() || '会議名未設定'
  const statusLabel = record.status === 'final' ? '確定' : '下書き'
  const minutesText = escapeHtml(record.minutes_text).replaceAll('\n', '<br />')
  const supplementNote = escapeHtml(record.supplement_note ?? '').replaceAll(
    '\n',
    '<br />'
  )
  const transcriptText = escapeHtml(record.transcript_text ?? '').replaceAll(
    '\n',
    '<br />'
  )

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
    record.supplement_note?.trim()
      ? `
  <div class="section-title">補足メモ</div>
  <div class="box">${supplementNote}</div>
  `
      : ''
  }

  ${
    record.transcript_text?.trim()
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

function getComparableMeetingName(record: BoardMinutesRecord) {
  return (record.meeting_name ?? '').trim().toLocaleLowerCase('ja')
}

function getComparableUpdatedAt(record: BoardMinutesRecord) {
  const time = new Date(record.updated_at).getTime()
  return Number.isNaN(time) ? 0 : time
}

export default function BoardMinutesRecordsClient({
  propertyId,
  caseId,
}: BoardMinutesRecordsClientProps) {
  const router = useRouter()

  const [records, setRecords] = useState<BoardMinutesRecord[]>([])
  const [filters, setFilters] = useState<SearchFilters>(initialSearchFilters)
  const [form, setForm] = useState<CreateFormState>(initialFormState)
  const [sortOption, setSortOption] = useState<SortOption>('updated_desc')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedRecordIds, setExpandedRecordIds] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [message, setMessage] = useState('')

  const apiBasePath = useMemo(() => {
    return `/api/properties/${propertyId}/cases/${caseId}/board-minutes-records`
  }, [propertyId, caseId])

  const summary = useMemo(() => {
    const total = records.length
    const draftCount = records.filter((record) => record.status === 'draft').length
    const finalCount = records.filter((record) => record.status === 'final').length
    const boardCount = records.filter(
      (record) => record.meeting_type === 'board'
    ).length
    const generalCount = records.filter(
      (record) => record.meeting_type === 'general'
    ).length
    const meetingCount = records.filter(
      (record) => record.meeting_type === 'meeting'
    ).length

    return {
      total,
      draftCount,
      finalCount,
      boardCount,
      generalCount,
      meetingCount,
    }
  }, [records])

  const sortedRecords = useMemo(() => {
    const next = [...records]

    next.sort((a, b) => {
      if (sortOption === 'updated_desc') {
        return getComparableUpdatedAt(b) - getComparableUpdatedAt(a)
      }

      if (sortOption === 'updated_asc') {
        return getComparableUpdatedAt(a) - getComparableUpdatedAt(b)
      }

      if (sortOption === 'meeting_name_asc') {
        return getComparableMeetingName(a).localeCompare(
          getComparableMeetingName(b),
          'ja'
        )
      }

      if (sortOption === 'meeting_name_desc') {
        return getComparableMeetingName(b).localeCompare(
          getComparableMeetingName(a),
          'ja'
        )
      }

      if (a.status === b.status) {
        return getComparableUpdatedAt(b) - getComparableUpdatedAt(a)
      }

      return a.status === 'final' ? -1 : 1
    })

    return next
  }, [records, sortOption])

  const loadRecords = useCallback(async (nextFilters: SearchFilters) => {
    setIsLoading(true)
    setErrorMessage('')
    setMessage('')

    try {
      const searchParams = new URLSearchParams()

      if (nextFilters.query.trim()) {
        searchParams.set('q', nextFilters.query.trim())
      }

      if (nextFilters.meetingType) {
        searchParams.set('meetingType', nextFilters.meetingType)
      }

      if (nextFilters.status) {
        searchParams.set('status', nextFilters.status)
      }

      const queryString = searchParams.toString()
      const response = await fetch(
        queryString ? `${apiBasePath}?${queryString}` : apiBasePath,
        {
          cache: 'no-store',
        }
      )

      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.error ?? '保存済み議事録の取得に失敗しました。')
      }

      setRecords(Array.isArray(json.records) ? json.records : [])
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '保存済み議事録の取得に失敗しました。'
      )
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }, [apiBasePath])

  useEffect(() => {
    void loadRecords(initialSearchFilters)
  }, [loadRecords])

  async function handleCreate() {
    if (!form.minutesText.trim()) {
      setErrorMessage('議事録本文を入れてください。')
      return
    }

    setIsCreating(true)
    setErrorMessage('')
    setMessage('')

    try {
      const response = await fetch(apiBasePath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.error ?? '議事録の保存に失敗しました。')
      }

      const createdId = json.record?.id as string | undefined

      if (!createdId) {
        throw new Error('保存はできましたが、IDの取得に失敗しました。')
      }

      setForm(initialFormState)
      router.push(
        `/properties/${propertyId}/cases/${caseId}/board-minutes-records/${createdId}`
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '議事録の保存に失敗しました。'
      )
    } finally {
      setIsCreating(false)
    }
  }

  async function handleSearch() {
    await loadRecords(filters)
  }

  async function handleResetFilters() {
    setFilters(initialSearchFilters)
    setSortOption('updated_desc')
    await loadRecords(initialSearchFilters)
  }

  async function handleDuplicate(record: BoardMinutesRecord) {
    setDuplicatingId(record.id)
    setErrorMessage('')
    setMessage('')

    try {
      const duplicatedMeetingName = record.meeting_name
        ? `${record.meeting_name}（複製）`
        : '複製した議事録'

      const response = await fetch(apiBasePath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingType: record.meeting_type,
          meetingName: duplicatedMeetingName,
          transcriptText: record.transcript_text ?? '',
          minutesText: record.minutes_text,
          supplementNote: record.supplement_note ?? '',
          formattingOptions: record.formatting_options ?? null,
          status: 'draft',
        }),
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.error ?? '複製に失敗しました。')
      }

      const createdId = json.record?.id as string | undefined

      if (!createdId) {
        throw new Error('複製はできましたが、IDの取得に失敗しました。')
      }

      router.push(
        `/properties/${propertyId}/cases/${caseId}/board-minutes-records/${createdId}`
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '複製に失敗しました。'
      )
    } finally {
      setDuplicatingId(null)
    }
  }

  async function handleToggleStatus(record: BoardMinutesRecord) {
    const nextStatus: BoardMinutesRecordStatus =
      record.status === 'final' ? 'draft' : 'final'

    setUpdatingStatusId(record.id)
    setErrorMessage('')
    setMessage('')

    try {
      const response = await fetch(`${apiBasePath}/${record.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingType: record.meeting_type,
          meetingName: record.meeting_name ?? '',
          transcriptText: record.transcript_text ?? '',
          minutesText: record.minutes_text,
          supplementNote: record.supplement_note ?? '',
          status: nextStatus,
        }),
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.error ?? '状態の更新に失敗しました。')
      }

      const updatedRecord = json.record as BoardMinutesRecord

      setRecords((current) =>
        current.map((item) => (item.id === updatedRecord.id ? updatedRecord : item))
      )

      setMessage(
        nextStatus === 'final'
          ? '議事録を確定にしました。'
          : '議事録を下書きに戻しました。'
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '状態の更新に失敗しました。'
      )
    } finally {
      setUpdatingStatusId(null)
    }
  }

  async function handleDelete(record: BoardMinutesRecord) {
    const confirmed = window.confirm(
      `「${record.meeting_name || '会議名未設定'}」を削除します。よろしいですか？`
    )

    if (!confirmed) {
      return
    }

    setDeletingId(record.id)
    setErrorMessage('')
    setMessage('')

    try {
      const response = await fetch(`${apiBasePath}/${record.id}`, {
        method: 'DELETE',
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.error ?? '削除に失敗しました。')
      }

      setRecords((current) => current.filter((item) => item.id !== record.id))
      setExpandedRecordIds((current) => current.filter((id) => id !== record.id))
      setMessage('議事録を削除しました。')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '削除に失敗しました。'
      )
    } finally {
      setDeletingId(null)
    }
  }

  function handleToggleExpanded(recordId: string) {
    setExpandedRecordIds((current) =>
      current.includes(recordId)
        ? current.filter((id) => id !== recordId)
        : [...current, recordId]
    )
  }

  async function handleCopyRecord(record: BoardMinutesRecord) {
    if (!record.minutes_text.trim()) {
      setErrorMessage('コピーする議事録本文がありません。')
      return
    }

    try {
      await navigator.clipboard.writeText(record.minutes_text)
      setMessage('議事録本文をコピーしました。')
      setErrorMessage('')
    } catch {
      setErrorMessage('本文コピーに失敗しました。')
    }
  }

  function handleDownloadTxt(record: BoardMinutesRecord) {
    if (!record.minutes_text.trim()) {
      setErrorMessage('保存する議事録本文がありません。')
      return
    }

    const meetingName = record.meeting_name?.trim() || '会議名未設定'
    const text = buildPlainTextDocument(record)
    const blob = new Blob(['\uFEFF', text], {
      type: 'text/plain;charset=utf-8',
    })

    downloadBlob(blob, `${meetingName}.txt`)
    setMessage('TXTで保存しました。')
    setErrorMessage('')
  }

  function handleDownloadWord(record: BoardMinutesRecord) {
    if (!record.minutes_text.trim()) {
      setErrorMessage('保存する議事録本文がありません。')
      return
    }

    const meetingName = record.meeting_name?.trim() || '会議名未設定'
    const html = buildWordHtmlDocument(record)
    const blob = new Blob(['\uFEFF', html], {
      type: 'application/msword;charset=utf-8',
    })

    downloadBlob(blob, `${meetingName}.doc`)
    setMessage('Word形式で保存しました。')
    setErrorMessage('')
  }

  function handlePrint(record: BoardMinutesRecord) {
    if (!record.minutes_text.trim()) {
      setErrorMessage('印刷する議事録本文がありません。')
      return
    }

    const printWindow = window.open('', '_blank', 'noopener,noreferrer')

    if (!printWindow) {
      setErrorMessage('印刷ウィンドウを開けませんでした。')
      return
    }

    const html = buildWordHtmlDocument(record)

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

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              保存済みAI議事録
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              AI議事録を保存・見返し・複製・再編集するページです。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/properties/${propertyId}/cases/${caseId}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              案件詳細へ戻る
            </Link>
            <Link
              href={`/properties/${propertyId}/cases/${caseId}/ai-board-minutes-pro`}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
            >
              AI議事録 本格版へ
            </Link>
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
        <h2 className="text-lg font-bold text-gray-900">新規保存</h2>
        <p className="mt-2 text-sm text-gray-600">
          既存のAI議事録画面で生成した結果を、ここに貼って保存できます。
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">会議種別</span>
            <select
              value={form.meetingType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  meetingType: event.target.value as MeetingType,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="board">理事会</option>
              <option value="general">総会</option>
              <option value="meeting">打合せ</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">会議名</span>
            <input
              value={form.meetingName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  meetingName: event.target.value,
                }))
              }
              placeholder="例：2026年4月定例理事会"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <label className="mt-4 block space-y-2">
          <span className="text-sm font-medium text-gray-700">文字起こし全文</span>
          <textarea
            value={form.transcriptText}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                transcriptText: event.target.value,
              }))
            }
            rows={8}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="必要なら文字起こし全文を貼ってください"
          />
        </label>

        <label className="mt-4 block space-y-2">
          <span className="text-sm font-medium text-gray-700">議事録本文</span>
          <textarea
            value={form.minutesText}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                minutesText: event.target.value,
              }))
            }
            rows={14}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="AI生成した議事録本文をここへ貼り付け"
          />
        </label>

        <label className="mt-4 block space-y-2">
          <span className="text-sm font-medium text-gray-700">補足メモ</span>
          <textarea
            value={form.supplementNote}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                supplementNote: event.target.value,
              }))
            }
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="保存時の補足メモ"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCreate}
            disabled={isCreating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? '保存中…' : 'この内容で保存する'}
          </button>

          <button
            type="button"
            onClick={() => setForm(initialFormState)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            入力をリセット
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">表示中件数</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{summary.total}</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-amber-700">下書き件数</p>
          <p className="mt-2 text-2xl font-bold text-amber-800">
            {summary.draftCount}
          </p>
        </div>

        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-green-700">確定件数</p>
          <p className="mt-2 text-2xl font-bold text-green-800">
            {summary.finalCount}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-blue-700">理事会</p>
          <p className="mt-2 text-2xl font-bold text-blue-800">
            {summary.boardCount}
          </p>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-purple-700">総会</p>
          <p className="mt-2 text-2xl font-bold text-purple-800">
            {summary.generalCount}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-600">打合せ</p>
          <p className="mt-2 text-2xl font-bold text-gray-800">
            {summary.meetingCount}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">保存済み一覧</h2>
            <p className="mt-2 text-sm text-gray-600">
              会議名や本文で検索でき、会議種別と状態でも絞り込みできます。
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-gray-700">検索</span>
              <input
                value={filters.query}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    query: event.target.value,
                  }))
                }
                placeholder="会議名や本文で検索"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">会議種別</span>
              <select
                value={filters.meetingType}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    meetingType: event.target.value as '' | MeetingType,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">すべて</option>
                <option value="board">理事会</option>
                <option value="general">総会</option>
                <option value="meeting">打合せ</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">状態</span>
              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    status: event.target.value as '' | BoardMinutesRecordStatus,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">すべて</option>
                <option value="draft">下書き</option>
                <option value="final">確定</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">並び替え</span>
              <select
                value={sortOption}
                onChange={(event) =>
                  setSortOption(event.target.value as SortOption)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="updated_desc">更新日が新しい順</option>
                <option value="updated_asc">更新日が古い順</option>
                <option value="meeting_name_asc">会議名 あいうえお順</option>
                <option value="meeting_name_desc">会議名 逆順</option>
                <option value="status">状態順（確定→下書き）</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSearch}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
            >
              検索する
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              条件をリセット
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {isLoading ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
              読み込み中です…
            </div>
          ) : sortedRecords.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-600">
              条件に合う保存済み議事録はありません。
            </div>
          ) : (
            sortedRecords.map((record) => {
              const isExpanded = expandedRecordIds.includes(record.id)
              const canExpand = record.minutes_text.length > 220
              const previewText =
                isExpanded || !canExpand
                  ? record.minutes_text
                  : `${record.minutes_text.slice(0, 220)}…`

              return (
                <div
                  key={record.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
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
                          {getStatusLabel(record.status)}
                        </span>
                      </div>

                      <h3 className="mt-3 text-base font-bold text-gray-900">
                        {record.meeting_name || '会議名未設定'}
                      </h3>

                      <p className="mt-2 text-xs text-gray-500">
                        更新日時：{formatDateTime(record.updated_at)}
                      </p>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {previewText}
                      </p>

                      {canExpand ? (
                        <button
                          type="button"
                          onClick={() => handleToggleExpanded(record.id)}
                          className="mt-2 text-sm font-medium text-blue-700 hover:underline"
                        >
                          {isExpanded ? 'たたむ' : '全文表示'}
                        </button>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleToggleStatus(record)}
                        disabled={
                          updatingStatusId === record.id || deletingId === record.id
                        }
                        className={`rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                          record.status === 'final'
                            ? 'border border-amber-300 text-amber-700 hover:bg-amber-50'
                            : 'border border-green-300 text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {updatingStatusId === record.id
                          ? '更新中…'
                          : record.status === 'final'
                          ? '下書きに戻す'
                          : '確定にする'}
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDuplicate(record)}
                        disabled={
                          duplicatingId === record.id || deletingId === record.id
                        }
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {duplicatingId === record.id ? '複製中…' : '複製して編集'}
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleCopyRecord(record)}
                        disabled={deletingId === record.id}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        本文コピー
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadTxt(record)}
                        disabled={deletingId === record.id}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        TXT保存
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadWord(record)}
                        disabled={deletingId === record.id}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Word保存
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePrint(record)}
                        disabled={deletingId === record.id}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        印刷
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(record)}
                        disabled={deletingId === record.id}
                        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === record.id ? '削除中…' : '削除'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/properties/${propertyId}/cases/${caseId}/board-minutes-records/${record.id}`
                          )
                        }
                        disabled={deletingId === record.id}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        開く
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}