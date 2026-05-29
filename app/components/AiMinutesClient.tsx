'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'

type MeetingType = '理事会' | '総会' | '修繕委員会' | '打合せ'
type SaveMode = 'task' | 'case'

type RunStage =
  | 'idle'
  | 'transcribing'
  | 'transcribed'
  | 'generating'
  | 'completed'
  | 'transcription_error'
  | 'generation_error'

type PropertyOption = {
  id: string
  name: string
}

type CaseOption = {
  id: string
  title: string
  propertyId: string | null
  status: string | null
}

type ExtractedActionItem = {
  title: string
  detail: string
  dueDate: string
}

type ActionItemCandidate = {
  id: string
  title: string
  detail: string
  dueDate: string
  selected: boolean
  isSaved: boolean
}

type AiMinutesClientProps = {
  properties: PropertyOption[]
  cases: CaseOption[]
  initialMeetingType?: MeetingType
  initialTranscript?: string
  initialMinutes?: string
}

const meetingOptions: MeetingType[] = ['理事会', '総会', '修繕委員会', '打合せ']

const meetingTitleMap: Record<MeetingType, string> = {
  理事会: '理事会議事録',
  総会: '総会議事録',
  修繕委員会: '修繕委員会議事録',
  打合せ: '打合せ記録',
}

const stageLabelMap: Record<RunStage, string> = {
  idle: '待機中',
  transcribing: '音声を解析中',
  transcribed: '文字起こし完了',
  generating: '議事録を生成中',
  completed: '完了',
  transcription_error: '文字起こし失敗',
  generation_error: '議事録生成失敗',
}

const actionItemSourceLabel = 'AI議事録由来'

function findStringByKeys(input: unknown, keys: string[]): string {
  if (!input || typeof input !== 'object') return ''

  const record = input as Record<string, unknown>

  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }

    if (value && typeof value === 'object') {
      const nested = findStringByKeys(value, keys)
      if (nested) return nested
    }
  }

  for (const value of Object.values(record)) {
    if (value && typeof value === 'object') {
      const nested = findStringByKeys(value, keys)
      if (nested) return nested
    }
  }

  return ''
}

function extractTranscriptionText(data: unknown): string {
  return findStringByKeys(data, ['transcript', 'text', 'result', 'output', 'content'])
}

function extractMinutesText(data: unknown): string {
  return findStringByKeys(data, ['minutes', 'content', 'result', 'output', 'text'])
}

function extractErrorMessage(data: unknown, fallback: string): string {
  const message = findStringByKeys(data, ['error', 'message', 'detail'])
  return message || fallback
}

function countAgendaItems(text: string): number {
  const matches = text.match(/第\s*\d+\s*号(?:議案|議題)/g)
  return matches ? matches.length : 0
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildMarkdownText(title: string, minutes: string) {
  const trimmed = minutes.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith(title)) return trimmed
  return `${title}\n\n${trimmed}`
}

function makeLocalId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function guessMimeTypeFromName(fileName: string) {
  const lowerName = fileName.toLowerCase()

  if (lowerName.endsWith('.m4a')) return 'audio/mp4'
  if (lowerName.endsWith('.mp4')) return 'video/mp4'
  if (lowerName.endsWith('.mp3')) return 'audio/mpeg'
  if (lowerName.endsWith('.wav')) return 'audio/wav'
  if (lowerName.endsWith('.webm')) return 'audio/webm'
  if (lowerName.endsWith('.oga')) return 'audio/ogg'
  if (lowerName.endsWith('.ogg')) return 'audio/ogg'

  return 'application/octet-stream'
}

function readFileAsBase64(file: File) {
  return new Promise<{
    base64: string
    fileName: string
    mimeType: string
  }>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const base64 = result.includes(',') ? result.split(',')[1] || '' : result

      if (!base64) {
        reject(new Error('音声ファイルの変換に失敗しました。'))
        return
      }

      resolve({
        base64,
        fileName: file.name,
        mimeType: file.type || guessMimeTypeFromName(file.name),
      })
    }

    reader.onerror = () => {
      reject(new Error('音声ファイルの読み込みに失敗しました。'))
    }

    reader.readAsDataURL(file)
  })
}

export default function AiMinutesClient({
  properties,
  cases,
  initialMeetingType = '理事会',
  initialTranscript = '',
  initialMinutes = '',
}: AiMinutesClientProps) {
  const [meetingType, setMeetingType] = useState<MeetingType>(initialMeetingType)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [transcript, setTranscript] = useState(initialTranscript)
  const [minutes, setMinutes] = useState(initialMinutes)

  const [stage, setStage] = useState<RunStage>('idle')
  const [saveMode, setSaveMode] = useState<SaveMode>('task')
  const [displayedProgress, setDisplayedProgress] = useState(0)

  const [formError, setFormError] = useState('')
  const [transcriptionError, setTranscriptionError] = useState('')
  const [generationError, setGenerationError] = useState('')
  const [copyMessage, setCopyMessage] = useState('')

  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRunAllProcessing, setIsRunAllProcessing] = useState(false)

  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [selectedCaseId, setSelectedCaseId] = useState('')

  const [actionItems, setActionItems] = useState<ActionItemCandidate[]>([])
  const [actionItemsInfo, setActionItemsInfo] = useState('')
  const [actionItemsError, setActionItemsError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isExtractingActionItems, setIsExtractingActionItems] = useState(false)
  const [isSavingActionItems, setIsSavingActionItems] = useState(false)

  const outputTitle = meetingTitleMap[meetingType]
  const agendaCount = useMemo(() => countAgendaItems(minutes), [minutes])

  const isBusy = isTranscribing || isGenerating || isRunAllProcessing

  const filteredCases = useMemo(() => {
    if (!selectedPropertyId) return cases
    return cases.filter((item) => item.propertyId === selectedPropertyId)
  }, [cases, selectedPropertyId])

  const selectedActionItemCount = useMemo(() => {
    return actionItems.filter((item) => item.selected && !item.isSaved).length
  }, [actionItems])

  const targetProgress = useMemo(() => {
    switch (stage) {
      case 'idle':
        return 0
      case 'transcribing':
        return 25
      case 'transcribed':
        return 50
      case 'generating':
        return 75
      case 'completed':
        return 100
      case 'transcription_error':
        return 25
      case 'generation_error':
        return 75
      default:
        return 0
    }
  }, [stage])

  const progressDescription = useMemo(() => {
    switch (stage) {
      case 'idle':
        return 'まだ処理は始まっていません。'
      case 'transcribing':
        return '音声を文字に変換しています。'
      case 'transcribed':
        return '文字起こしが終わりました。次は議事録生成です。'
      case 'generating':
        return '文字起こし結果をもとに議事録をまとめています。'
      case 'completed':
        return '議事録生成まで完了しました。'
      case 'transcription_error':
        return '文字起こし段階で止まりました。'
      case 'generation_error':
        return '議事録生成段階で止まりました。'
      default:
        return ''
    }
  }, [stage])

  useEffect(() => {
    if (!selectedCaseId) return

    const existsInFiltered = filteredCases.some((item) => item.id === selectedCaseId)

    if (!existsInFiltered) {
      setSelectedCaseId('')
    }
  }, [filteredCases, selectedCaseId])

  useEffect(() => {
    if (displayedProgress === targetProgress) return

    const timer = window.setInterval(() => {
      setDisplayedProgress((prev) => {
        if (prev < targetProgress) return prev + 1
        if (prev > targetProgress) return prev - 1
        return prev
      })
    }, 18)

    return () => window.clearInterval(timer)
  }, [displayedProgress, targetProgress])

  const stepStates = useMemo(() => {
    return {
      transcribingDone: ['transcribed', 'generating', 'completed', 'generation_error'].includes(stage),
      transcribingActive: stage === 'transcribing',

      transcribedDone: ['generating', 'completed', 'generation_error'].includes(stage),
      transcribedActive: stage === 'transcribed',

      generatingDone: stage === 'completed',
      generatingActive: stage === 'generating',

      completedDone: stage === 'completed',
      completedActive: stage === 'completed',
    }
  }, [stage])

  async function requestTranscription(file: File): Promise<string> {
    const payload = await readFileAsBase64(file)

    const response = await fetch('/api/ai-transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meetingType,
        fileName: payload.fileName,
        mimeType: payload.mimeType,
        base64: payload.base64,
      }),
      cache: 'no-store',
    })

    let data: unknown = null

    try {
      data = await response.json()
    } catch {
      data = null
    }

    if (!response.ok) {
      throw new Error(extractErrorMessage(data, '文字起こしに失敗しました。'))
    }

    const text = extractTranscriptionText(data)

    if (!text) {
      throw new Error('文字起こし結果が空でした。')
    }

    return text
  }

  async function requestMinutesGeneration(sourceTranscript: string): Promise<string> {
    const response = await fetch('/api/ai-minutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript: sourceTranscript,
        transcriptText: sourceTranscript,
        meetingType,
        meeting_type: meetingType,
      }),
    })

    let data: unknown = null

    try {
      data = await response.json()
    } catch {
      data = null
    }

    if (!response.ok) {
      throw new Error(extractErrorMessage(data, '議事録生成に失敗しました。'))
    }

    const text = extractMinutesText(data)

    if (!text) {
      throw new Error('議事録の生成結果が空でした。')
    }

    return text
  }

  async function requestActionItems(sourceMinutes: string): Promise<ExtractedActionItem[]> {
    const response = await fetch('/api/ai-minutes/action-items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        minutes: sourceMinutes,
        meetingType,
      }),
    })

    const data = (await response.json()) as {
      ok?: boolean
      items?: ExtractedActionItem[]
      error?: string
    }

    if (!response.ok) {
      throw new Error(data.error || '宿題候補の抽出に失敗しました。')
    }

    return Array.isArray(data.items) ? data.items : []
  }

  function resetInlineMessages() {
    setFormError('')
    setTranscriptionError('')
    setGenerationError('')
    setCopyMessage('')
  }

  function resetActionItemsMessages() {
    setActionItemsInfo('')
    setActionItemsError('')
    setSaveSuccess('')
    setSaveError('')
  }

  function clearActionItemsForFreshOutput() {
    setActionItems([])
    resetActionItemsMessages()
  }

  function normalizeExtractedActionItems(items: ExtractedActionItem[]) {
    return items
      .map((item) => ({
        id: makeLocalId(),
        title: String(item.title || '').trim(),
        detail: String(item.detail || '').trim(),
        dueDate: String(item.dueDate || '').trim(),
        selected: true,
        isSaved: false,
      }))
      .filter((item) => item.title)
  }

  async function extractActionItemsFromMinutes(sourceMinutes?: string) {
    const targetMinutes = String(sourceMinutes ?? minutes).trim()

    if (!targetMinutes) {
      setActionItemsError('先に議事録を生成してください。')
      return
    }

    setIsExtractingActionItems(true)
    setActionItemsInfo('')
    setActionItemsError('')
    setSaveSuccess('')
    setSaveError('')

    try {
      const extracted = await requestActionItems(targetMinutes)
      const normalized = normalizeExtractedActionItems(extracted)

      setActionItems(normalized)

      if (normalized.length === 0) {
        setActionItemsInfo('追加候補となる宿題は見つかりませんでした。')
      } else {
        setActionItemsInfo(
          `${normalized.length}件の宿題候補を抽出しました。追加方法を選んでください。`,
        )
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '宿題候補の抽出中に不明なエラーが発生しました。'
      setActionItemsError(message)
    } finally {
      setIsExtractingActionItems(false)
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setAudioFile(file)
    setFormError('')
    setCopyMessage('')
    setTranscriptionError('')
    setStage('idle')
  }

  async function handleTranscribeOnly() {
    if (!audioFile) {
      setFormError('音声ファイルを選択してください。')
      setStage('transcription_error')
      return
    }

    resetInlineMessages()
    clearActionItemsForFreshOutput()
    setIsTranscribing(true)
    setStage('transcribing')

    try {
      const transcriptionText = await requestTranscription(audioFile)
      setTranscript(transcriptionText)
      setStage('transcribed')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '文字起こし中に不明なエラーが発生しました。'
      setTranscriptionError(message)
      setStage('transcription_error')
    } finally {
      setIsTranscribing(false)
    }
  }

  async function handleGenerateOnly() {
    const sourceTranscript = transcript.trim()

    if (!sourceTranscript) {
      setGenerationError('先に文字起こし結果を入力してください。')
      setStage('generation_error')
      return
    }

    setFormError('')
    setGenerationError('')
    setCopyMessage('')
    clearActionItemsForFreshOutput()

    setIsGenerating(true)
    setStage('generating')

    try {
      const generatedMinutes = await requestMinutesGeneration(sourceTranscript)
      setMinutes(generatedMinutes)
      setStage('completed')
      await extractActionItemsFromMinutes(generatedMinutes)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '議事録生成中に不明なエラーが発生しました。'
      setGenerationError(message)
      setStage('generation_error')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleRunAll() {
    if (!audioFile) {
      setFormError('音声ファイルを選択してください。')
      setStage('transcription_error')
      return
    }

    resetInlineMessages()
    clearActionItemsForFreshOutput()
    setIsRunAllProcessing(true)

    let currentStep: 'transcription' | 'generation' = 'transcription'

    try {
      setStage('transcribing')
      const transcriptionText = await requestTranscription(audioFile)
      setTranscript(transcriptionText)

      setStage('transcribed')

      currentStep = 'generation'
      setStage('generating')

      const generatedMinutes = await requestMinutesGeneration(transcriptionText)
      setMinutes(generatedMinutes)
      setStage('completed')
      await extractActionItemsFromMinutes(generatedMinutes)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '一発生成中に不明なエラーが発生しました。'

      if (currentStep === 'transcription') {
        setTranscriptionError(message)
        setStage('transcription_error')
      } else {
        setGenerationError(message)
        setStage('generation_error')
      }
    } finally {
      setIsRunAllProcessing(false)
    }
  }

  async function handleCopy() {
    if (!minutes.trim()) {
      setCopyMessage('コピーする議事録がありません。')
      return
    }

    try {
      await navigator.clipboard.writeText(minutes)
      setCopyMessage('議事録をコピーしました。')
    } catch {
      setCopyMessage('コピーに失敗しました。')
    }
  }

  function handlePrint() {
    if (!minutes.trim()) {
      setGenerationError('印刷する議事録がありません。')
      return
    }

    const html = `
<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(outputTitle)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
      margin: 32px;
      color: #111827;
      line-height: 1.8;
      white-space: pre-wrap;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 24px;
    }
    .meta {
      margin-bottom: 24px;
      color: #4b5563;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(outputTitle)}</h1>
  <div class="meta">会議種別：${escapeHtml(meetingType)}</div>
  <div>${escapeHtml(minutes)}</div>
</body>
</html>
    `.trim()

    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=960,height=720')

    if (!printWindow) {
      setGenerationError('印刷画面を開けませんでした。ポップアップ設定を確認してください。')
      return
    }

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  function handleDownloadMarkdown() {
    if (!minutes.trim()) {
      setGenerationError('.md で保存する議事録がありません。')
      return
    }

    const content = buildMarkdownText(outputTitle, minutes)
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')

    a.href = url
    a.download = `${outputTitle}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    URL.revokeObjectURL(url)
  }

  function updateActionItem(
    id: string,
    field: 'title' | 'detail' | 'dueDate' | 'selected',
    value: string | boolean,
  ) {
    setActionItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    )
  }

  async function handleSaveSelectedItems() {
    setSaveSuccess('')
    setSaveError('')

    const itemsToSave = actionItems.filter(
      (item) => item.selected && !item.isSaved && item.title.trim(),
    )

    if (itemsToSave.length === 0) {
      setSaveError(`追加する${saveMode === 'task' ? '宿題' : '案件'}を1件以上選んでください。`)
      return
    }

    if (saveMode === 'task' && !selectedCaseId) {
      setSaveError('タスクとして追加する場合は、追加先の案件を選択してください。')
      return
    }

    if (saveMode === 'case' && !selectedPropertyId) {
      setSaveError('案件として追加する場合は、追加先の物件を選択してください。')
      return
    }

    setIsSavingActionItems(true)

    try {
      const response = await fetch('/api/ai-minutes/action-items', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          saveMode,
          caseId: selectedCaseId,
          propertyId: selectedPropertyId,
          meetingType,
          sourceLabel: actionItemSourceLabel,
          items: itemsToSave.map((item) => ({
            title: item.title.trim(),
            detail: item.detail.trim(),
            dueDate: item.dueDate.trim(),
          })),
        }),
      })

      const data = (await response.json()) as {
        ok?: boolean
        createdCount?: number
        error?: string
      }

      if (!response.ok) {
        throw new Error(data.error || '追加に失敗しました。')
      }

      const savedIds = new Set(itemsToSave.map((item) => item.id))

      setActionItems((prev) =>
        prev.map((item) =>
          savedIds.has(item.id)
            ? {
                ...item,
                isSaved: true,
                selected: false,
              }
            : item,
        ),
      )

      const createdCount = data.createdCount ?? itemsToSave.length
      const noun = saveMode === 'task' ? 'タスク' : '案件'
      setSaveSuccess(`${createdCount}件を${noun}として追加しました。`)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '保存中に不明なエラーが発生しました。'
      setSaveError(message)
    } finally {
      setIsSavingActionItems(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">AI議事録作成</h2>
          <p className="mt-1 text-sm text-slate-600">
            録音ファイルから議事録を作成し、そのまま宿題をタスクまたは案件へつなげます。
          </p>
        </div>

        <div className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
          現在の状態：{stageLabelMap[stage]}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="mb-4 text-base font-semibold text-slate-900">基本設定</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  会議種別
                </label>
                <select
                  value={meetingType}
                  onChange={(event) => setMeetingType(event.target.value as MeetingType)}
                  disabled={isBusy}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                >
                  {meetingOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  音声ファイル
                </label>
                <input
                  type="file"
                  accept="audio/*,.m4a,.mp3,.wav,.mp4,.mpeg,.mpga,.webm,.oga"
                  onChange={handleFileChange}
                  disabled={isBusy}
                  className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
                />
                <p className="mt-2 text-sm text-slate-600">
                  選択中：
                  <span className="ml-1 font-medium text-slate-900">
                    {audioFile ? audioFile.name : '未選択'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h3 className="mb-4 text-base font-semibold text-emerald-900">主役導線</h3>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleRunAll}
                disabled={isBusy}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {isRunAllProcessing ? '一発生成を実行中...' : '一発生成'}
              </button>

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={handleTranscribeOnly}
                  disabled={isBusy}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isTranscribing ? '文字起こし中...' : '音声を文字起こし'}
                </button>

                <button
                  type="button"
                  onClick={handleGenerateOnly}
                  disabled={isBusy}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isGenerating ? '議事録生成中...' : 'AI議事録を生成'}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-4 text-base font-semibold text-slate-900">進行状況</h3>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                <span>全体進捗</span>
                <span>{displayedProgress}%</span>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-none"
                  style={{ width: `${displayedProgress}%` }}
                />
              </div>

              <p className="mt-3 text-sm text-slate-600">{progressDescription}</p>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <span>1. 音声を解析中</span>
                <span className="font-medium text-slate-700">
                  {stepStates.transcribingActive
                    ? '進行中'
                    : stepStates.transcribingDone
                      ? '完了'
                      : '待機'}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <span>2. 文字起こし完了</span>
                <span className="font-medium text-slate-700">
                  {stepStates.transcribedActive
                    ? '反映中'
                    : stepStates.transcribedDone
                      ? '完了'
                      : '待機'}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <span>3. 議事録を生成中</span>
                <span className="font-medium text-slate-700">
                  {stepStates.generatingActive
                    ? '進行中'
                    : stepStates.generatingDone
                      ? '完了'
                      : '待機'}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <span>4. 完了</span>
                <span className="font-medium text-slate-700">
                  {stepStates.completedActive || stepStates.completedDone ? '完了' : '待機'}
                </span>
              </div>
            </div>

            {formError ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {formError}
              </div>
            ) : null}

            {transcriptionError ? (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                文字起こしエラー：{transcriptionError}
              </div>
            ) : null}

            {generationError ? (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                議事録生成エラー：{generationError}
              </div>
            ) : null}

            {copyMessage ? (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {copyMessage}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">文字起こし欄</h3>
                <p className="text-sm text-slate-600">
                  一発生成後も内容はここに残ります。必要なら手動修正もできます。
                </p>
              </div>
            </div>

            <textarea
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder="ここに文字起こし結果が入ります。"
              className="min-h-[260px] w-full rounded-xl border border-slate-300 px-3 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-slate-400"
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{outputTitle}</h3>
                <p className="text-sm text-slate-600">
                  議案件数：
                  <span className="ml-1 font-medium text-slate-900">{agendaCount}件</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  コピー
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  印刷
                </button>

                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  .md保存
                </button>
              </div>
            </div>

            <textarea
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
              placeholder="ここにAI議事録の出力結果が入ります。"
              className="min-h-[320px] w-full rounded-xl border border-slate-300 px-3 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-slate-400"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">宿題 → 追加</h3>
                <p className="text-sm text-slate-600">
                  議事録の最後に出た宿題を候補化し、タスクまたは案件として追加できます。
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  追加時には、補足メモへ「{actionItemSourceLabel} / {meetingType}」を自動追記します。
                </p>
              </div>

              <button
                type="button"
                onClick={() => extractActionItemsFromMinutes()}
                disabled={!minutes.trim() || isExtractingActionItems}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                {isExtractingActionItems ? '宿題候補を抽出中...' : '宿題候補を再抽出'}
              </button>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold text-slate-700">追加方法</p>
              <div className="grid gap-2 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSaveMode('task')}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    saveMode === 'task'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  タスクとして追加
                </button>

                <button
                  type="button"
                  onClick={() => setSaveMode('case')}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    saveMode === 'case'
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  案件として追加
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  追加先の物件
                </label>
                <select
                  value={selectedPropertyId}
                  onChange={(event) => setSelectedPropertyId(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                >
                  <option value="">物件を選択してください</option>
                  {properties.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {saveMode === 'task' ? '追加先の案件' : '既存案件の選択は不要'}
                </label>
                {saveMode === 'task' ? (
                  <select
                    value={selectedCaseId}
                    onChange={(event) => setSelectedCaseId(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  >
                    <option value="">案件を選択してください</option>
                    {filteredCases.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                        {item.status ? `（${item.status}）` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    案件として追加する場合は、選択した宿題ごとに新しい案件を作成します。
                  </div>
                )}
              </div>
            </div>

            {actionItemsInfo ? (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {actionItemsInfo}
              </div>
            ) : null}

            {actionItemsError ? (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                {actionItemsError}
              </div>
            ) : null}

            {saveSuccess ? (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {saveSuccess}
              </div>
            ) : null}

            {saveError ? (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                {saveError}
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              {actionItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  議事録を生成すると、ここに宿題候補が並びます。
                </div>
              ) : (
                actionItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 ${
                      item.isSaved
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          disabled={item.isSaved}
                          onChange={(event) =>
                            updateActionItem(item.id, 'selected', event.target.checked)
                          }
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        宿題 {index + 1}
                      </label>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                          {actionItemSourceLabel}
                        </span>

                        {item.isSaved ? (
                          <span className="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                            追加済み
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">
                            追加しない場合はチェックを外してください
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          {saveMode === 'task' ? 'タスク名' : '案件名'}
                        </label>
                        <input
                          value={item.title}
                          onChange={(event) =>
                            updateActionItem(item.id, 'title', event.target.value)
                          }
                          disabled={item.isSaved}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          補足メモ
                        </label>
                        <textarea
                          value={item.detail}
                          onChange={(event) =>
                            updateActionItem(item.id, 'detail', event.target.value)
                          }
                          disabled={item.isSaved}
                          className="min-h-[90px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-7 text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          期限（任意）
                        </label>
                        <input
                          type="date"
                          value={item.dueDate}
                          onChange={(event) =>
                            updateActionItem(item.id, 'dueDate', event.target.value)
                          }
                          disabled={item.isSaved}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-600">
                選択中：
                <span className="ml-1 font-semibold text-slate-900">
                  {selectedActionItemCount}件
                </span>
              </p>

              <button
                type="button"
                onClick={handleSaveSelectedItems}
                disabled={isSavingActionItems || actionItems.length === 0}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {saveMode === 'task'
                  ? isSavingActionItems
                    ? 'タスク追加中...'
                    : '選択した宿題をタスク追加'
                  : isSavingActionItems
                    ? '案件追加中...'
                    : '選択した宿題を案件追加'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}