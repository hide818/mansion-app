'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'

type CaseFileRow = {
  id: string
  file_name: string | null
  file_url: string | null
  file_type: string | null
  category: string | null
  note?: string | null
  created_at?: string | null
}

type SavedSetFileRow = {
  id: string
  case_file_id: string
  sort_order: number
  comment: string | null
  created_at: string
}

type SavedSetRow = {
  id: string
  title: string
  property_id: string
  case_id: string
  mode: 'report' | 'resolution' | 'proposal'
  progress_text: string | null
  recent_action_text: string | null
  next_plan_text: string | null
  staff_note: string | null
  decision_text: string | null
  agenda_title: string | null
  agenda_body: string | null
  include_cover_page: boolean
  created_at: string
  board_report_set_files: SavedSetFileRow[]
}

type BoardReportEditorProps = {
  propertyId?: string
  caseId?: string
  propertyName?: string | null
  caseTitle?: string | null
  progress?: string | null
  recentAction?: string | null
  nextSchedule?: string | null
  decisionNeed?: string | null
  caseFiles?: CaseFileRow[]
}

type ReportMode = 'report' | 'resolution' | 'proposal'

type SelectedFileForPrint = {
  id: string
  file_name: string | null
  file_url: string | null
  file_type: string | null
  category: string | null
  note: string
  print_note: string
}

const CATEGORY_PRIORITY: Record<string, number> = {
  estimate: 1,
  photo: 2,
  report: 3,
  drawing: 4,
  other: 5,
}

function getCategoryLabel(category: string | null | undefined) {
  switch (category) {
    case 'estimate':
      return '見積書'
    case 'photo':
      return '現地写真'
    case 'report':
      return '報告書'
    case 'drawing':
      return '図面'
    default:
      return 'その他資料'
  }
}

function getFileTypeLabel(fileType: string | null | undefined) {
  if (!fileType) return '不明'
  if (fileType.startsWith('image/')) return '画像'
  if (fileType === 'application/pdf') return 'PDF'
  return fileType
}

function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function BoardReportEditor({
  propertyId,
  caseId,
  propertyName,
  caseTitle,
  progress,
  recentAction,
  nextSchedule,
  decisionNeed,
  caseFiles = [],
}: BoardReportEditorProps) {
  const params = useParams<{ id?: string; caseId?: string }>()

  const safePropertyId =
    typeof propertyId === 'string' && propertyId.trim() !== ''
      ? propertyId
      : typeof params?.id === 'string'
        ? params.id
        : ''

  const safeCaseId =
    typeof caseId === 'string' && caseId.trim() !== ''
      ? caseId
      : typeof params?.caseId === 'string'
        ? params.caseId
        : ''

  const initialPropertyName =
    typeof propertyName === 'string' && propertyName.trim() !== ''
      ? propertyName
      : '物件名未設定'

  const initialCaseTitle =
    typeof caseTitle === 'string' && caseTitle.trim() !== ''
      ? caseTitle
      : '案件名未設定'

  const [editablePropertyName, setEditablePropertyName] = useState(initialPropertyName)
  const [editableCaseTitle, setEditableCaseTitle] = useState(initialCaseTitle)

  const displayPropertyName = editablePropertyName.trim() || '物件名未設定'
  const displayCaseTitle = editableCaseTitle.trim() || '案件名未設定'

  const [mode, setMode] = useState<ReportMode>('report')
  const [copied, setCopied] = useState(false)
  const [includeCoverPage, setIncludeCoverPage] = useState(true)

  const [progressText, setProgressText] = useState(
    typeof progress === 'string' && progress.trim() !== ''
      ? progress
      : `本案件「${initialCaseTitle}」の進捗についてご報告いたします。`
  )

  const [recentActionText, setRecentActionText] = useState(
    typeof recentAction === 'string' && recentAction.trim() !== ''
      ? recentAction
      : '直近の対応内容を記載してください。'
  )

  const [nextPlanText, setNextPlanText] = useState(
    typeof nextSchedule === 'string' && nextSchedule.trim() !== ''
      ? nextSchedule
      : '今後の予定を記載してください。'
  )

  const [staffNote, setStaffNote] = useState('')

  const [decisionText, setDecisionText] = useState(
    typeof decisionNeed === 'string' && decisionNeed.trim() !== ''
      ? decisionNeed
      : `本案件「${initialCaseTitle}」について、理事会にて確認・判断をお願いしたい事項を記載してください。`
  )

  const [agendaTitle, setAgendaTitle] = useState(initialCaseTitle)

  const [agendaBody, setAgendaBody] = useState(
    `【議案内容】
本案件「${initialCaseTitle}」について、現在の状況および今後の対応方針をご審議いただきたく上程いたします。`
  )

  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
  const [selectedFileComments, setSelectedFileComments] = useState<Record<string, string>>({})

  const [saveTitle, setSaveTitle] = useState('')
  const [savedSets, setSavedSets] = useState<SavedSetRow[]>([])
  const [loadingSets, setLoadingSets] = useState(false)
  const [savingSet, setSavingSet] = useState(false)

  const caseFilesMap = useMemo(() => {
    return new Map(caseFiles.map((file) => [file.id, file]))
  }, [caseFiles])

  const selectedFiles = useMemo(() => {
    return selectedFileIds
      .map((id) => caseFilesMap.get(id))
      .filter((file): file is CaseFileRow => Boolean(file))
  }, [selectedFileIds, caseFilesMap])

  const unselectedFiles = useMemo(() => {
    return caseFiles.filter((file) => !selectedFileIds.includes(file.id))
  }, [caseFiles, selectedFileIds])

  const copyText = useMemo(() => {
    if (mode === 'resolution') {
      return ['【決議事項あり】', '', decisionText.trim()].join('\n')
    }

    if (mode === 'proposal') {
      return [
        '【上程文】',
        '',
        '議案名',
        agendaTitle.trim(),
        '',
        '議案内容',
        agendaBody.trim(),
      ].join('\n')
    }

    return [
      '【報告事項】',
      '',
      '本案件の進捗について',
      progressText.trim(),
      '',
      '直近の対応',
      recentActionText.trim(),
      '',
      '今後の予定',
      nextPlanText.trim(),
      '',
      '担当者追記',
      staffNote.trim() || '特になし',
    ].join('\n')
  }, [
    mode,
    decisionText,
    agendaTitle,
    agendaBody,
    progressText,
    recentActionText,
    nextPlanText,
    staffNote,
  ])

  const selectedFilesForPrint = useMemo<SelectedFileForPrint[]>(() => {
    return selectedFiles.map((file) => ({
      id: file.id,
      file_name: file.file_name,
      file_url: file.file_url,
      file_type: file.file_type,
      category: file.category,
      note: file.note ?? '',
      print_note: selectedFileComments[file.id] ?? '',
    }))
  }, [selectedFiles, selectedFileComments])

  const printHref = useMemo(() => {
    if (!safePropertyId || !safeCaseId) {
      return ''
    }

    const searchParams = new URLSearchParams()

    searchParams.set('mode', mode)
    searchParams.set('propertyName', displayPropertyName)
    searchParams.set('caseTitle', displayCaseTitle)
    searchParams.set('includeCoverPage', includeCoverPage ? 'true' : 'false')

    if (mode === 'report') {
      searchParams.set('progressText', progressText)
      searchParams.set('recentActionText', recentActionText)
      searchParams.set('nextPlanText', nextPlanText)
      searchParams.set('staffNote', staffNote)
    }

    if (mode === 'resolution') {
      searchParams.set('decisionText', decisionText)
    }

    if (mode === 'proposal') {
      searchParams.set('agendaTitle', agendaTitle)
      searchParams.set('agendaBody', agendaBody)
    }

    if (selectedFilesForPrint.length > 0) {
      searchParams.set('selectedFiles', JSON.stringify(selectedFilesForPrint))
    }

    return `/properties/${safePropertyId}/cases/${safeCaseId}/board-print?${searchParams.toString()}`
  }, [
    safePropertyId,
    safeCaseId,
    displayPropertyName,
    displayCaseTitle,
    mode,
    includeCoverPage,
    progressText,
    recentActionText,
    nextPlanText,
    staffNote,
    decisionText,
    agendaTitle,
    agendaBody,
    selectedFilesForPrint,
  ])

  useEffect(() => {
    async function fetchSavedSets() {
      if (!safePropertyId || !safeCaseId) {
        return
      }

      try {
        setLoadingSets(true)

        const response = await fetch(
          `/api/board-report-sets?propertyId=${encodeURIComponent(safePropertyId)}&caseId=${encodeURIComponent(safeCaseId)}`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        )

        const result = (await response.json()) as {
          items?: SavedSetRow[]
          error?: string
        }

        if (!response.ok) {
          throw new Error(result.error || '保存済み理事会提出セットの取得に失敗しました。')
        }

        setSavedSets(Array.isArray(result.items) ? result.items : [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingSets(false)
      }
    }

    fetchSavedSets()
  }, [safePropertyId, safeCaseId])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(copyText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      alert('コピーに失敗しました。')
    }
  }

  function toggleFile(fileId: string) {
    setSelectedFileIds((prev) => {
      if (prev.includes(fileId)) {
        return prev.filter((id) => id !== fileId)
      }
      return [...prev, fileId]
    })

    setSelectedFileComments((prev) => {
      const next = { ...prev }

      if (fileId in next) {
        return next
      }

      next[fileId] = ''
      return next
    })
  }

  function updateSelectedFileComment(fileId: string, value: string) {
    setSelectedFileComments((prev) => ({
      ...prev,
      [fileId]: value,
    }))
  }

  function moveSelectedFileUp(fileId: string) {
    setSelectedFileIds((prev) => {
      const index = prev.indexOf(fileId)
      if (index <= 0) return prev

      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  function moveSelectedFileDown(fileId: string) {
    setSelectedFileIds((prev) => {
      const index = prev.indexOf(fileId)
      if (index === -1 || index >= prev.length - 1) return prev

      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }

  function sortSelectedFilesByRecommendation() {
    setSelectedFileIds((prev) => {
      return [...prev].sort((a, b) => {
        const fileA = caseFilesMap.get(a)
        const fileB = caseFilesMap.get(b)

        const priorityA = CATEGORY_PRIORITY[fileA?.category ?? 'other'] ?? 999
        const priorityB = CATEGORY_PRIORITY[fileB?.category ?? 'other'] ?? 999

        if (priorityA !== priorityB) {
          return priorityA - priorityB
        }

        const nameA = fileA?.file_name ?? ''
        const nameB = fileB?.file_name ?? ''

        return nameA.localeCompare(nameB, 'ja')
      })
    })
  }

  async function refreshSavedSets() {
    if (!safePropertyId || !safeCaseId) {
      return
    }

    const response = await fetch(
      `/api/board-report-sets?propertyId=${encodeURIComponent(safePropertyId)}&caseId=${encodeURIComponent(safeCaseId)}`,
      {
        method: 'GET',
        cache: 'no-store',
      }
    )

    const result = (await response.json()) as {
      items?: SavedSetRow[]
      error?: string
    }

    if (!response.ok) {
      throw new Error(result.error || '保存済み理事会提出セットの再取得に失敗しました。')
    }

    setSavedSets(Array.isArray(result.items) ? result.items : [])
  }

  async function handleSaveSet() {
    if (!safePropertyId || !safeCaseId) {
      alert('物件IDまたは案件IDを取得できません。')
      return
    }

    const title = saveTitle.trim()

    if (!title) {
      alert('保存タイトルを入力してください。')
      return
    }

    try {
      setSavingSet(true)

      const response = await fetch('/api/board-report-sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          property_id: safePropertyId,
          case_id: safeCaseId,
          mode,
          progress_text: progressText,
          recent_action_text: recentActionText,
          next_plan_text: nextPlanText,
          staff_note: staffNote,
          decision_text: decisionText,
          agenda_title: agendaTitle,
          agenda_body: agendaBody,
          include_cover_page: includeCoverPage,
          files: selectedFiles.map((file, index) => ({
            case_file_id: file.id,
            sort_order: index + 1,
            comment: selectedFileComments[file.id] ?? '',
          })),
        }),
      })

      const result = (await response.json()) as {
        ok?: boolean
        error?: string
      }

      if (!response.ok) {
        throw new Error(result.error || '理事会提出セットの保存に失敗しました。')
      }

      await refreshSavedSets()
      setSaveTitle('')
      alert('理事会提出セットを保存しました。')
    } catch (error) {
      alert(error instanceof Error ? error.message : '理事会提出セットの保存に失敗しました。')
    } finally {
      setSavingSet(false)
    }
  }

  function handleApplySavedSet(savedSet: SavedSetRow) {
    setMode(savedSet.mode)
    setProgressText(savedSet.progress_text ?? '')
    setRecentActionText(savedSet.recent_action_text ?? '')
    setNextPlanText(savedSet.next_plan_text ?? '')
    setStaffNote(savedSet.staff_note ?? '')
    setDecisionText(savedSet.decision_text ?? '')
    setAgendaTitle(savedSet.agenda_title ?? '')
    setAgendaBody(savedSet.agenda_body ?? '')
    setIncludeCoverPage(Boolean(savedSet.include_cover_page))

    const nextSelectedIds = savedSet.board_report_set_files
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((file) => file.case_file_id)
      .filter((id) => caseFilesMap.has(id))

    const nextComments: Record<string, string> = {}
    savedSet.board_report_set_files.forEach((file) => {
      nextComments[file.case_file_id] = file.comment ?? ''
    })

    setSelectedFileIds(nextSelectedIds)
    setSelectedFileComments(nextComments)
  }

  function handleOpenPrintPage() {
    if (!safePropertyId || !safeCaseId) {
      alert('物件IDまたは案件IDを取得できません。案件詳細ページから開き直してください。')
      return
    }

    if (!printHref) {
      alert('印刷用ページのURL作成に失敗しました。')
      return
    }

    window.open(printHref, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">ワンクリック理事会報告</h2>
        <p className="mt-1 text-sm text-slate-600">
          本文、表紙、添付資料、資料コメント、保存済みセットをまとめて扱えます。
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              物件名
            </label>
            <input
              type="text"
              value={editablePropertyName}
              onChange={(e) => setEditablePropertyName(e.target.value)}
              placeholder="物件名を入力"
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              案件名
            </label>
            <input
              type="text"
              value={editableCaseTitle}
              onChange={(e) => setEditableCaseTitle(e.target.value)}
              placeholder="案件名を入力"
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-500"
            />
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-600">
          ここで編集した物件名・案件名は、印刷用ページに反映されます。
        </p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode('report')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            mode === 'report'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          報告事項
        </button>

        <button
          type="button"
          onClick={() => setMode('resolution')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            mode === 'resolution'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          決議事項あり
        </button>

        <button
          type="button"
          onClick={() => setMode('proposal')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            mode === 'proposal'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          上程文
        </button>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <label className="flex items-center gap-3 text-sm font-medium text-slate-800">
          <input
            type="checkbox"
            checked={includeCoverPage}
            onChange={(e) => setIncludeCoverPage(e.target.checked)}
            className="h-4 w-4"
          />
          表紙ページを付ける
        </label>
        <p className="mt-2 text-sm text-slate-600">
          ONにすると、印刷時に理事会提出資料の表紙を1ページ目に追加します。
        </p>
      </div>

      {mode === 'report' && (
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              本案件の進捗について
            </label>
            <textarea
              value={progressText}
              onChange={(e) => setProgressText(e.target.value)}
              rows={7}
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              直近の対応
            </label>
            <textarea
              value={recentActionText}
              onChange={(e) => setRecentActionText(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              今後の予定
            </label>
            <textarea
              value={nextPlanText}
              onChange={(e) => setNextPlanText(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              担当者追記
            </label>
            <textarea
              value={staffNote}
              onChange={(e) => setStaffNote(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-500"
            />
          </div>
        </div>
      )}

      {mode === 'resolution' && (
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            理事会で確認・判断いただきたい事項
          </label>
          <textarea
            value={decisionText}
            onChange={(e) => setDecisionText(e.target.value)}
            rows={10}
            className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-500"
          />
        </div>
      )}

      {mode === 'proposal' && (
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              議案名
            </label>
            <input
              type="text"
              value={agendaTitle}
              onChange={(e) => setAgendaTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              議案内容
            </label>
            <textarea
              value={agendaBody}
              onChange={(e) => setAgendaBody(e.target.value)}
              rows={10}
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-500"
            />
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">今回使う添付資料を選ぶ</h3>
            <p className="mt-1 text-sm text-slate-600">
              チェックした資料だけ、印刷用ページの後半に表示します。
            </p>
          </div>

          <button
            type="button"
            onClick={sortSelectedFilesByRecommendation}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            おすすめ順に並べる
          </button>
        </div>

        {unselectedFiles.length === 0 ? (
          <p className="text-sm text-slate-500">追加で選べる添付資料はありません。</p>
        ) : (
          <div className="space-y-3">
            {unselectedFiles.map((file) => (
              <label
                key={file.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3"
              >
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => toggleFile(file.id)}
                  className="mt-1 h-4 w-4"
                />

                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold text-slate-900">
                    {file.file_name ?? '名称未設定'}
                  </p>

                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
                    <span className="rounded-full bg-slate-100 px-2 py-1">
                      {getCategoryLabel(file.category)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">
                      {getFileTypeLabel(file.file_type)}
                    </span>
                  </div>

                  {file.note ? (
                    <p className="mt-2 text-xs text-slate-500">{file.note}</p>
                  ) : null}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <div className="mb-3">
          <h3 className="text-base font-bold text-blue-900">印刷対象の添付資料</h3>
          <p className="mt-1 text-sm text-blue-800">
            上下ボタンで順番変更、コメント欄で理事会向け説明を追記できます。
          </p>
        </div>

        {selectedFiles.length === 0 ? (
          <p className="text-sm text-blue-800">まだ資料は選択されていません。</p>
        ) : (
          <div className="space-y-3">
            {selectedFiles.map((file, index) => {
              const isFirst = index === 0
              const isLast = index === selectedFiles.length - 1

              return (
                <div
                  key={file.id}
                  className="rounded-xl border border-blue-200 bg-white p-3"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {index + 1}. {file.file_name ?? '名称未設定'}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-full bg-slate-100 px-2 py-1">
                          {getCategoryLabel(file.category)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-1">
                          {getFileTypeLabel(file.file_type)}
                        </span>
                      </div>

                      <div className="mt-3">
                        <label className="mb-2 block text-sm font-medium text-slate-800">
                          理事会向けコメント
                        </label>
                        <textarea
                          value={selectedFileComments[file.id] ?? ''}
                          onChange={(e) => updateSelectedFileComment(file.id, e.target.value)}
                          rows={3}
                          placeholder="例: 3月18日現地確認時の写真です。A案上程予定です。"
                          className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => moveSelectedFileUp(file.id)}
                        disabled={isFirst}
                        className={`rounded-lg px-3 py-2 text-sm font-medium ${
                          isFirst
                            ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                            : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                        }`}
                      >
                        上へ
                      </button>

                      <button
                        type="button"
                        onClick={() => moveSelectedFileDown(file.id)}
                        disabled={isLast}
                        className={`rounded-lg px-3 py-2 text-sm font-medium ${
                          isLast
                            ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                            : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                        }`}
                      >
                        下へ
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleFile(file.id)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                      >
                        外す
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="mb-3">
          <h3 className="text-base font-bold text-emerald-900">理事会提出セット保存</h3>
          <p className="mt-1 text-sm text-emerald-800">
            本文、表紙設定、添付資料、順番、コメントをまとめて保存できます。
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            value={saveTitle}
            onChange={(e) => setSaveTitle(e.target.value)}
            placeholder="例: 2026年3月理事会提出版"
            className="w-full rounded-xl border border-emerald-300 px-3 py-3 text-sm outline-none focus:border-emerald-500 md:max-w-md"
          />

          <button
            type="button"
            onClick={handleSaveSet}
            disabled={savingSet}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
              savingSet ? 'bg-emerald-300' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {savingSet ? '保存中...' : '提出セットとして保存'}
          </button>
        </div>

        <div className="mt-5">
          <h4 className="text-sm font-bold text-emerald-900">保存済み提出セット</h4>

          {loadingSets ? (
            <p className="mt-2 text-sm text-emerald-800">読み込み中です...</p>
          ) : savedSets.length === 0 ? (
            <p className="mt-2 text-sm text-emerald-800">まだ保存された提出セットはありません。</p>
          ) : (
            <div className="mt-3 space-y-3">
              {savedSets.map((savedSet) => (
                <div
                  key={savedSet.id}
                  className="rounded-xl border border-emerald-200 bg-white p-3"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {savedSet.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        作成日時: {formatDateTime(savedSet.created_at)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        モード: {savedSet.mode} / 表紙: {savedSet.include_cover_page ? 'あり' : 'なし'} / 資料: {savedSet.board_report_set_files.length}件
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplySavedSet(savedSet)}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                    >
                      このセットを読み込む
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-2">
          <h3 className="text-base font-bold text-slate-900">コピー内容プレビュー</h3>
          <p className="mt-1 text-sm text-slate-600">
            添付資料名は本文に入れず、本文だけをコピーします。
          </p>
        </div>

        <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-800">
          {copyText}
        </pre>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          {copied ? 'コピーしました' : '本文をコピー'}
        </button>

        <button
          type="button"
          onClick={handleOpenPrintPage}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          印刷用ページを開く
        </button>
      </div>

      {(!safePropertyId || !safeCaseId) && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">
            物件IDまたは案件IDを取得できていません。
          </p>
          <p className="mt-1 text-sm text-red-700">
            案件詳細ページのURLが /properties/物件ID/cases/案件ID の形になっているか確認してください。
          </p>
        </div>
      )}
    </section>
  )
}