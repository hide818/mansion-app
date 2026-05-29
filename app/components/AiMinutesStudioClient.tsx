'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type PropertyOption = {
  id: string
  name: string
}

type CaseOption = {
  id: string
  propertyId: string
  title: string
  status: string
}

type HomeworkCandidate = {
  id: string
  title: string
  detail: string
  recommendedType: 'task' | 'case'
  selected: boolean
}

type AgendaItem = {
  id: string
  title: string
  text: string
}

type BannerState =
  | {
      type: 'success' | 'error' | 'info'
      text: string
    }
  | null

type AiMinutesStudioClientProps = {
  properties: PropertyOption[]
  cases: CaseOption[]
  lockedPropertyId?: string
  lockedCaseId?: string
  lockedPropertyName?: string
  lockedCaseTitle?: string
}

type GenerateResponse = {
  agendaItems?: Array<{
    title?: string
    text?: string
  }>
  minutesText?: string
  homeworkCandidates?: Array<{
    title?: string
    detail?: string
    recommendedType?: 'task' | 'case' | string
  }>
  error?: string
}

type ActionsResponse = {
  createdCount?: number
  error?: string
}

type TranscribeResponse = {
  text?: string
  error?: string
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function createAgendaItem(index: number): AgendaItem {
  return {
    id: `agenda-${Date.now()}-${index}`,
    title: '',
    text: '',
  }
}

function composeMinutesFromAgenda(items: AgendaItem[]) {
  return items
    .map((item) => {
      const title = safeString(item.title)
      const text = safeString(item.text)

      if (!title && !text) return ''

      if (title && text) {
        return `${title}\n${text}`
      }

      if (title) return title
      return text
    })
    .filter(Boolean)
    .join('\n\n')
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildMinutesMarkdown(params: {
  title: string
  meetingType: string
  propertyName: string
  caseTitle: string
  transcript: string
  agendaItems: AgendaItem[]
  homeworkCandidates: HomeworkCandidate[]
}) {
  const lines: string[] = []

  lines.push(`# ${params.title}`)
  lines.push('')
  lines.push(`- 会議種別: ${params.meetingType}`)
  lines.push(`- 物件: ${params.propertyName || '未設定'}`)
  lines.push(`- 案件: ${params.caseTitle || '未設定'}`)
  lines.push('')

  lines.push('## 議事録')
  lines.push('')
  lines.push(composeMinutesFromAgenda(params.agendaItems) || '未生成')
  lines.push('')

  lines.push('## 宿題候補')
  lines.push('')
  if (params.homeworkCandidates.length === 0) {
    lines.push('- 宿題候補なし')
  } else {
    params.homeworkCandidates.forEach((item) => {
      lines.push(`- ${item.title}`)
      if (item.detail) {
        lines.push(`  - 詳細: ${item.detail}`)
      }
      lines.push(
        `  - 推奨追加先: ${item.recommendedType === 'task' ? 'タスク' : '案件'}`
      )
    })
  }
  lines.push('')

  lines.push('## 文字起こし')
  lines.push('')
  lines.push(params.transcript || '未生成')

  return lines.join('\n')
}

function buildMinutesWordHtml(params: {
  title: string
  markdown: string
}) {
  const html = escapeHtml(params.markdown).replaceAll('\n', '<br />')

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(params.title)}</title>
</head>
<body style="font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; color: #0f172a; line-height: 1.8; padding: 24px;">
  <div style="font-size: 28px; font-weight: 700; margin-bottom: 20px;">
    ${escapeHtml(params.title)}
  </div>
  <div style="font-size: 14px;">
    ${html}
  </div>
</body>
</html>
  `.trim()
}

function normalizeHomeworkCandidates(
  raw: GenerateResponse['homeworkCandidates']
): HomeworkCandidate[] {
  if (!Array.isArray(raw)) return []

  return raw.map((item, index) => {
    const title = safeString(item?.title) || `宿題候補 ${index + 1}`
    const detail = safeString(item?.detail)
    const recommendedType =
      safeString(item?.recommendedType) === 'case' ? 'case' : 'task'

    return {
      id: `hw-${index + 1}`,
      title,
      detail,
      recommendedType,
      selected: false,
    }
  })
}

function normalizeAgendaItems(
  raw: GenerateResponse['agendaItems'],
  fallbackTitles: string[]
): AgendaItem[] {
  const normalized: AgendaItem[] = []

  if (Array.isArray(raw) && raw.length > 0) {
    const maxLength = Math.max(raw.length, fallbackTitles.length)

    for (let index = 0; index < maxLength; index += 1) {
      const rawItem = raw[index]
      const rawTitle = safeString(rawItem?.title)
      const rawText = safeString(rawItem?.text)

      normalized.push({
        id: `agenda-${Date.now()}-${index + 1}`,
        title: rawTitle || fallbackTitles[index] || `第${index + 1}号議案`,
        text: rawText,
      })
    }

    return normalized
  }

  if (fallbackTitles.length === 0) {
    return [createAgendaItem(1)]
  }

  for (let index = 0; index < fallbackTitles.length; index += 1) {
    normalized.push({
      id: `agenda-${Date.now()}-${index + 1}`,
      title: fallbackTitles[index],
      text: '',
    })
  }

  return normalized
}

export default function AiMinutesStudioClient({
  properties,
  cases,
  lockedPropertyId,
  lockedCaseId,
  lockedPropertyName,
  lockedCaseTitle,
}: AiMinutesStudioClientProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [meetingType, setMeetingType] = useState('理事会')
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    lockedPropertyId ?? ''
  )
  const [selectedCaseId, setSelectedCaseId] = useState(lockedCaseId ?? '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [transcript, setTranscript] = useState('')
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([
    {
      id: 'agenda-initial-1',
      title: '',
      text: '',
    },
  ])
  const [homeworkCandidates, setHomeworkCandidates] = useState<
    HomeworkCandidate[]
  >([])
  const [targetType, setTargetType] = useState<'task' | 'case'>('task')

  const [banner, setBanner] = useState<BannerState>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAddingHomework, setIsAddingHomework] = useState(false)

  const availableCases = useMemo(() => {
    return cases.filter((caseItem) => caseItem.propertyId === selectedPropertyId)
  }, [cases, selectedPropertyId])

  const selectedProperty = useMemo(() => {
    return (
      properties.find((property) => property.id === selectedPropertyId) ?? null
    )
  }, [properties, selectedPropertyId])

  const selectedCase = useMemo(() => {
    return (
      availableCases.find((caseItem) => caseItem.id === selectedCaseId) ?? null
    )
  }, [availableCases, selectedCaseId])

  const exportTitle = useMemo(() => {
    const propertyLabel =
      lockedPropertyName || selectedProperty?.name || '物件未選択'
    const caseLabel = lockedCaseTitle || selectedCase?.title || '案件未選択'
    return `${meetingType}_${propertyLabel}_${caseLabel}_議事録AI`
  }, [
    meetingType,
    lockedPropertyName,
    lockedCaseTitle,
    selectedProperty?.name,
    selectedCase?.title,
  ])

  const finalMinutesText = useMemo(() => {
    return composeMinutesFromAgenda(agendaItems)
  }, [agendaItems])

  useEffect(() => {
    if (lockedCaseId) {
      setSelectedCaseId(lockedCaseId)
      return
    }

    if (!selectedCaseId) return

    const exists = availableCases.some(
      (caseItem) => caseItem.id === selectedCaseId
    )
    if (!exists) {
      setSelectedCaseId('')
    }
  }, [availableCases, lockedCaseId, selectedCaseId])

  function showBanner(type: 'success' | 'error' | 'info', text: string) {
    setBanner({ type, text })
  }

  function toggleHomeworkSelected(id: string) {
    setHomeworkCandidates((current) =>
      current.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    )
  }

  function addAgendaRow() {
    setAgendaItems((current) => [...current, createAgendaItem(current.length + 1)])
  }

  function removeAgendaRow(id: string) {
    setAgendaItems((current) => {
      if (current.length === 1) {
        return [
          {
            ...current[0],
            title: '',
            text: '',
          },
        ]
      }

      return current.filter((item) => item.id !== id)
    })
  }

  function moveAgendaUp(id: string) {
    setAgendaItems((current) => {
      const index = current.findIndex((item) => item.id === id)
      if (index <= 0) return current

      const next = [...current]
      const temp = next[index - 1]
      next[index - 1] = next[index]
      next[index] = temp
      return next
    })
  }

  function moveAgendaDown(id: string) {
    setAgendaItems((current) => {
      const index = current.findIndex((item) => item.id === id)
      if (index < 0 || index >= current.length - 1) return current

      const next = [...current]
      const temp = next[index + 1]
      next[index + 1] = next[index]
      next[index] = temp
      return next
    })
  }

  function updateAgendaTitle(id: string, value: string) {
    setAgendaItems((current) =>
      current.map((item) => (item.id === id ? { ...item, title: value } : item))
    )
  }

  function updateAgendaText(id: string, value: string) {
    setAgendaItems((current) =>
      current.map((item) => (item.id === id ? { ...item, text: value } : item))
    )
  }

  async function transcribeAudioOnly() {
    if (!selectedFile) {
      showBanner('error', '音声ファイルを選択してください。')
      return ''
    }

    setIsTranscribing(true)
    setBanner(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('meetingType', meetingType)

      const response = await fetch('/api/ai/minutes/transcribe', {
        method: 'POST',
        body: formData,
      })

      const json = (await response.json()) as TranscribeResponse

      if (!response.ok) {
        throw new Error(json.error || '文字起こしに失敗しました。')
      }

      const nextTranscript = json.text ?? ''
      setTranscript(nextTranscript)
      showBanner('success', '文字起こしを完了しました。')
      return nextTranscript
    } catch (error) {
      console.error(error)
      showBanner(
        'error',
        error instanceof Error ? error.message : '文字起こしに失敗しました。'
      )
      return ''
    } finally {
      setIsTranscribing(false)
    }
  }

  async function generateMinutesOnly(transcriptSource?: string) {
    const transcriptToUse = (transcriptSource ?? transcript).trim()
    const agendaTitles = agendaItems
      .map((item) => safeString(item.title))
      .filter(Boolean)

    if (!transcriptToUse) {
      showBanner('error', '先に文字起こしを入れてください。')
      return
    }

    if (agendaTitles.length === 0) {
      showBanner('error', '少なくとも1件は議案タイトルを入れてください。')
      return
    }

    setIsGenerating(true)
    setBanner(null)

    try {
      const response = await fetch('/api/ai/minutes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingType,
          transcript: transcriptToUse,
          propertyName: lockedPropertyName || selectedProperty?.name || '',
          caseTitle: lockedCaseTitle || selectedCase?.title || '',
          agendaTitles,
        }),
      })

      const json = (await response.json()) as GenerateResponse

      if (!response.ok) {
        throw new Error(json.error || '議事録生成に失敗しました。')
      }

      setAgendaItems(normalizeAgendaItems(json.agendaItems, agendaTitles))
      setHomeworkCandidates(normalizeHomeworkCandidates(json.homeworkCandidates))
      showBanner('success', '議案ごとのAI議事録生成を完了しました。')
    } catch (error) {
      console.error(error)
      showBanner(
        'error',
        error instanceof Error ? error.message : '議事録生成に失敗しました。'
      )
    } finally {
      setIsGenerating(false)
    }
  }

  async function runAll() {
    const hasTranscript = transcript.trim().length > 0

    if (hasTranscript) {
      await generateMinutesOnly(transcript)
      return
    }

    const transcribed = await transcribeAudioOnly()
    if (!transcribed) return
    await generateMinutesOnly(transcribed)
  }

  async function addSelectedHomework() {
    const selectedItems = homeworkCandidates.filter((item) => item.selected)

    if (!selectedPropertyId) {
      showBanner('error', '追加先の物件を選択してください。')
      return
    }

    if (selectedItems.length === 0) {
      showBanner('error', '追加する宿題を選択してください。')
      return
    }

    setIsAddingHomework(true)
    setBanner(null)

    try {
      const response = await fetch('/api/ai/minutes/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetType,
          propertyId: selectedPropertyId,
          caseId: selectedCaseId || null,
          items: selectedItems.map((item) => ({
            title: item.title,
            detail: item.detail,
            recommendedType: item.recommendedType,
          })),
          sourceLabel: `${meetingType} / 議事録AI`,
        }),
      })

      const json = (await response.json()) as ActionsResponse

      if (!response.ok) {
        throw new Error(json.error || '宿題追加に失敗しました。')
      }

      setHomeworkCandidates((current) =>
        current.map((item) =>
          item.selected ? { ...item, selected: false } : item
        )
      )

      showBanner(
        'success',
        `${json.createdCount ?? selectedItems.length}件を${
          targetType === 'task' ? 'タスク' : '案件'
        }へ追加しました。`
      )
    } catch (error) {
      console.error(error)
      showBanner(
        'error',
        error instanceof Error ? error.message : '宿題追加に失敗しました。'
      )
    } finally {
      setIsAddingHomework(false)
    }
  }

  async function copyMinutes() {
    if (!finalMinutesText.trim()) {
      showBanner('error', 'まだ議事録がありません。')
      return
    }

    try {
      await navigator.clipboard.writeText(finalMinutesText)
      showBanner('success', '議事録をコピーしました。')
    } catch (error) {
      console.error(error)
      showBanner('error', 'コピーに失敗しました。')
    }
  }

  function handleDownloadMarkdown() {
    const markdown = buildMinutesMarkdown({
      title: exportTitle,
      meetingType,
      propertyName: lockedPropertyName || selectedProperty?.name || '',
      caseTitle: lockedCaseTitle || selectedCase?.title || '',
      transcript,
      agendaItems,
      homeworkCandidates,
    })

    downloadFile(`${exportTitle}.md`, markdown, 'text/markdown;charset=utf-8')
    showBanner('success', 'Markdown保存を完了しました。')
  }

  function handleDownloadWord() {
    const markdown = buildMinutesMarkdown({
      title: exportTitle,
      meetingType,
      propertyName: lockedPropertyName || selectedProperty?.name || '',
      caseTitle: lockedCaseTitle || selectedCase?.title || '',
      transcript,
      agendaItems,
      homeworkCandidates,
    })

    const html = buildMinutesWordHtml({
      title: exportTitle,
      markdown,
    })

    downloadFile(`${exportTitle}.doc`, html, 'application/msword;charset=utf-8')
    showBanner('success', 'Word保存を完了しました。')
  }

  function handlePrint() {
    const markdown = buildMinutesMarkdown({
      title: exportTitle,
      meetingType,
      propertyName: lockedPropertyName || selectedProperty?.name || '',
      caseTitle: lockedCaseTitle || selectedCase?.title || '',
      transcript,
      agendaItems,
      homeworkCandidates,
    })

    const html = buildMinutesWordHtml({
      title: exportTitle,
      markdown,
    })

    const printWindow = window.open('', '_blank', 'width=1200,height=900')
    if (!printWindow) {
      showBanner('error', '印刷画面を開けませんでした。')
      return
    }

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div className="p-6 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-sm font-semibold tracking-[0.18em] text-emerald-600">
                議事録AI
              </div>
              <h1 className="mt-3 text-3xl font-bold text-slate-900">
                議案入力型スタジオ
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                議案名は自分で入れ、AIが各議案ごとの本文を作成します。文字起こし、議案ごとの議事録生成、宿題抽出、案件追加、タスク追加までをこの画面で完結させます。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={runAll}
                disabled={isTranscribing || isGenerating}
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isTranscribing || isGenerating ? '処理中...' : '一括実行'}
              </button>
              <button
                type="button"
                onClick={copyMinutes}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                コピー
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                印刷
              </button>
              <button
                type="button"
                onClick={handleDownloadMarkdown}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Markdown保存
              </button>
              <button
                type="button"
                onClick={handleDownloadWord}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Word保存
              </button>
            </div>
          </div>

          {banner ? (
            <div
              className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                banner.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : banner.type === 'error'
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-sky-200 bg-sky-50 text-sky-700'
              }`}
            >
              {banner.text}
            </div>
          ) : null}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-bold text-slate-900">基本設定</div>
              <p className="mt-1 text-sm text-slate-500">
                追加先の物件・案件を決めてから、音声アップロードと議事録生成を行います。
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    会議種別
                  </label>
                  <select
                    value={meetingType}
                    onChange={(event) => setMeetingType(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300"
                  >
                    <option value="理事会">理事会</option>
                    <option value="総会">総会</option>
                    <option value="定例会">定例会</option>
                    <option value="打ち合わせ">打ち合わせ</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    物件
                  </label>
                  <select
                    value={selectedPropertyId}
                    onChange={(event) => setSelectedPropertyId(event.target.value)}
                    disabled={Boolean(lockedPropertyId)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300 disabled:bg-slate-50"
                  >
                    <option value="">物件を選択してください</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    案件
                  </label>
                  <select
                    value={selectedCaseId}
                    onChange={(event) => setSelectedCaseId(event.target.value)}
                    disabled={Boolean(lockedCaseId) || !selectedPropertyId}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300 disabled:bg-slate-50"
                  >
                    <option value="">案件を選択してください</option>
                    {availableCases.map((caseItem) => (
                      <option key={caseItem.id} value={caseItem.id}>
                        {caseItem.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      音声ファイル
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      m4a, mp3, wav などをそのまま入れてください。
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".m4a,.mp3,.wav,.mp4,.aac,.webm,.mpeg,.mpga"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null
                        setSelectedFile(file)
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      ファイルを選択
                    </button>
                    <button
                      type="button"
                      onClick={() => void transcribeAudioOnly()}
                      disabled={isTranscribing}
                      className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isTranscribing ? '文字起こし中...' : '文字起こしのみ'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void generateMinutesOnly()}
                      disabled={isGenerating}
                      className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isGenerating ? '生成中...' : '議案本文生成'}
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                  選択中: {selectedFile?.name || '未選択'}
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    議案タイトル設定
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    例: 第1号議案 修繕積立金値上げ改定について
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addAgendaRow}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  議案を追加
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {agendaItems.map((item, index) => {
                  const isFirst = index === 0
                  const isLast = index === agendaItems.length - 1

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="text-sm font-bold text-slate-900">
                          議案 {index + 1}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => moveAgendaUp(item.id)}
                            disabled={isFirst}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            上へ
                          </button>
                          <button
                            type="button"
                            onClick={() => moveAgendaDown(item.id)}
                            disabled={isLast}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            下へ
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAgendaRow(item.id)}
                            className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                          >
                            削除
                          </button>
                        </div>
                      </div>

                      <input
                        value={item.title}
                        onChange={(event) =>
                          updateAgendaTitle(item.id, event.target.value)
                        }
                        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300"
                        placeholder="第1号議案 修繕積立金値上げ改定について"
                      />

                      <textarea
                        value={item.text}
                        onChange={(event) =>
                          updateAgendaText(item.id, event.target.value)
                        }
                        rows={7}
                        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-emerald-300"
                        placeholder="AIがこの議案の本文をここへ入れます。生成後は手動修正もできます。"
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-bold text-slate-900">文字起こし欄</div>
              <p className="mt-1 text-sm text-slate-500">
                一括実行後もここで手動修正できます。
              </p>

              <textarea
                value={transcript}
                onChange={(event) => setTranscript(event.target.value)}
                rows={14}
                className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-emerald-300"
                placeholder="ここに文字起こし結果が入ります。"
              />
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-bold text-slate-900">
                議事録全文プレビュー
              </div>
              <p className="mt-1 text-sm text-slate-500">
                各議案欄の内容を自動でつなげた出力用全文です。
              </p>

              <textarea
                value={finalMinutesText}
                readOnly
                rows={18}
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-900 outline-none"
                placeholder="ここに議案別本文をつないだ全文が表示されます。"
              />
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-bold text-slate-900">宿題 → 追加</div>
              <p className="mt-1 text-sm text-slate-500">
                議事録から抽出した宿題を、案件またはタスクへ追加します。
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setTargetType('task')}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    targetType === 'task'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  タスクとして追加
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('case')}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    targetType === 'case'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  案件として追加
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                追加先物件:{' '}
                {lockedPropertyName || selectedProperty?.name || '未選択'}
                <br />
                追加先案件: {lockedCaseTitle || selectedCase?.title || '未選択'}
              </div>

              <div className="mt-4 space-y-3">
                {homeworkCandidates.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    まだ宿題候補はありません。議案本文生成後にここへ表示されます。
                  </div>
                ) : (
                  homeworkCandidates.map((item) => (
                    <label
                      key={item.id}
                      className={`block rounded-2xl border p-4 transition ${
                        item.selected
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => toggleHomeworkSelected(item.id)}
                          className="mt-1"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-bold text-slate-900">
                              {item.title}
                            </div>
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                                item.recommendedType === 'task'
                                  ? 'bg-sky-100 text-sky-700'
                                  : 'bg-violet-100 text-violet-700'
                              }`}
                            >
                              推奨:{' '}
                              {item.recommendedType === 'task'
                                ? 'タスク'
                                : '案件'}
                            </span>
                          </div>

                          <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                            {item.detail || '詳細なし'}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => void addSelectedHomework()}
                disabled={isAddingHomework}
                className="mt-4 w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAddingHomework
                  ? '追加中...'
                  : `選択した宿題を${targetType === 'task' ? 'タスク' : '案件'}追加`}
              </button>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-bold text-slate-900">使い方</div>
              <ol className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <li>1. 物件・案件を選ぶ</li>
                <li>2. 議案タイトルを入力する</li>
                <li>3. 必要に応じて議案順を上へ・下へで並び替える</li>
                <li>4. 音声ファイルを選ぶ</li>
                <li>5. 一括実行を押す</li>
                <li>6. 各議案本文を必要に応じて手修正する</li>
                <li>7. 宿題を選んで案件またはタスクへ追加する</li>
                <li>8. コピー・印刷・保存で出力する</li>
              </ol>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}