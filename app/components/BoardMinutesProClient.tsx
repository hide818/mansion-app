'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  buildPlainTextDocument,
  buildWordHtmlDocument,
  COMPANY_STANDARD_FORMATTING,
  getPropertyFormattingStorageKey,
  mergeBoardMinutesFormattingOptions,
  type BoardMinutesGenerationResult,
} from '@/lib/boardMinutesShared'
import type {
  BoardMinutesFormattingOptions,
  BoardMinutesRecordStatus,
  MeetingType,
} from '@/lib/boardMinutesRecords'

type RouteParams = {
  id?: string
  caseId?: string
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

export default function BoardMinutesProClient() {
  const router = useRouter()
  const params = useParams<RouteParams>()

  const propertyId = typeof params.id === 'string' ? params.id : ''
  const caseId = typeof params.caseId === 'string' ? params.caseId : ''

  const [meetingType, setMeetingType] = useState<MeetingType>('board')
  const [meetingName, setMeetingName] = useState('')
  const [transcriptText, setTranscriptText] = useState('')
  const [supplementNote, setSupplementNote] = useState('')
  const [formattingOptions, setFormattingOptions] =
    useState<BoardMinutesFormattingOptions>(COMPANY_STANDARD_FORMATTING)

  const [generatedTitle, setGeneratedTitle] = useState('')
  const [generatedMinutesText, setGeneratedMinutesText] = useState('')
  const [actionItems, setActionItems] = useState<string[]>([])
  const [confirmationItems, setConfirmationItems] = useState<string[]>([])
  const [formattingApplied, setFormattingApplied] =
    useState<BoardMinutesFormattingOptions>(COMPANY_STANDARD_FORMATTING)

  const [isGenerating, setIsGenerating] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isSavingFinal, setIsSavingFinal] = useState(false)
  const [lastSavedRecordId, setLastSavedRecordId] = useState('')
  const [lastSavedStatus, setLastSavedStatus] =
    useState<BoardMinutesRecordStatus>('draft')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const generateApiPath = useMemo(() => {
    if (!propertyId || !caseId) {
      return ''
    }

    return `/api/properties/${propertyId}/cases/${caseId}/ai-board-minutes-pro`
  }, [propertyId, caseId])

  const saveApiPath = useMemo(() => {
    if (!propertyId || !caseId) {
      return ''
    }

    return `/api/properties/${propertyId}/cases/${caseId}/board-minutes-records`
  }, [propertyId, caseId])

  useEffect(() => {
    if (!propertyId) {
      return
    }

    const storageKey = getPropertyFormattingStorageKey(propertyId)
    const raw = window.localStorage.getItem(storageKey)

    if (!raw) {
      setFormattingOptions(COMPANY_STANDARD_FORMATTING)
      return
    }

    try {
      const parsed = JSON.parse(raw)
      setFormattingOptions(mergeBoardMinutesFormattingOptions(parsed))
    } catch {
      setFormattingOptions(COMPANY_STANDARD_FORMATTING)
    }
  }, [propertyId])

  function handleFormattingChange(
    key: keyof BoardMinutesFormattingOptions,
    value: string
  ) {
    setFormattingOptions((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function handleApplyCompanyStandard() {
    setFormattingOptions(COMPANY_STANDARD_FORMATTING)
    setMessage('会社標準の書式に戻しました。')
    setErrorMessage('')
  }

  function handleSavePropertyStandard() {
    if (!propertyId) {
      setErrorMessage('物件IDを取得できません。')
      return
    }

    const storageKey = getPropertyFormattingStorageKey(propertyId)
    window.localStorage.setItem(storageKey, JSON.stringify(formattingOptions))
    setMessage('この物件の標準書式として保存しました。')
    setErrorMessage('')
  }

  function handleClearPropertyStandard() {
    if (!propertyId) {
      setErrorMessage('物件IDを取得できません。')
      return
    }

    const storageKey = getPropertyFormattingStorageKey(propertyId)
    window.localStorage.removeItem(storageKey)
    setFormattingOptions(COMPANY_STANDARD_FORMATTING)
    setMessage('この物件の保存済み書式を削除し、会社標準に戻しました。')
    setErrorMessage('')
  }

  async function handleGenerate() {
    if (!generateApiPath) {
      setErrorMessage('生成先URLを作れませんでした。')
      return
    }

    if (!transcriptText.trim()) {
      setErrorMessage('文字起こし全文を入れてください。')
      return
    }

    setIsGenerating(true)
    setMessage('')
    setErrorMessage('')

    try {
      const response = await fetch(generateApiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingType,
          meetingName,
          transcriptText,
          supplementNote,
          formattingOptions,
        }),
      })

      const json = (await response.json()) as BoardMinutesGenerationResult & {
        error?: string
      }

      if (!response.ok) {
        throw new Error(json.error ?? 'AI議事録の生成に失敗しました。')
      }

      setGeneratedTitle(json.minutesTitle || meetingName || 'AI議事録')
      setGeneratedMinutesText(json.minutesText || '')
      setActionItems(Array.isArray(json.actionItems) ? json.actionItems : [])
      setConfirmationItems(
        Array.isArray(json.confirmationItems) ? json.confirmationItems : []
      )
      setFormattingApplied(
        mergeBoardMinutesFormattingOptions(json.formattingApplied)
      )

      if (!meetingName.trim() && json.minutesTitle?.trim()) {
        setMeetingName(json.minutesTitle.trim())
      }

      setMessage('AI議事録を生成しました。必要なら本文を微修正してから保存してください。')
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'AI議事録の生成に失敗しました。'
      )
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleSave(status: BoardMinutesRecordStatus) {
    if (!saveApiPath) {
      setErrorMessage('保存先URLを作れませんでした。')
      return
    }

    if (!generatedMinutesText.trim()) {
      setErrorMessage('保存する議事録本文がありません。')
      return
    }

    if (status === 'draft') {
      setIsSavingDraft(true)
    } else {
      setIsSavingFinal(true)
    }

    setMessage('')
    setErrorMessage('')

    try {
      const response = await fetch(saveApiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingType,
          meetingName: meetingName.trim() || generatedTitle.trim(),
          transcriptText,
          minutesText: generatedMinutesText,
          supplementNote,
          formattingOptions: formattingApplied,
          status,
          preventDuplicate: true,
        }),
      })

      const json = (await response.json()) as {
        record?: { id?: string }
        alreadyExists?: boolean
        error?: string
      }

      if (!response.ok) {
        throw new Error(json.error ?? '保存に失敗しました。')
      }

      const savedId =
        typeof json.record?.id === 'string' ? json.record.id : ''

      setLastSavedRecordId(savedId)
      setLastSavedStatus(status)

      if (json.alreadyExists) {
        setMessage('同じ内容の保存済み議事録が既にあるため、既存データを開ける状態にしました。')
      } else {
        setMessage(
          status === 'final'
            ? '議事録を確定保存しました。'
            : '議事録を下書き保存しました。'
        )
      }

      setErrorMessage('')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '保存に失敗しました。'
      )
    } finally {
      setIsSavingDraft(false)
      setIsSavingFinal(false)
    }
  }

  async function handleCopy() {
    if (!generatedMinutesText.trim()) {
      setErrorMessage('コピーする議事録本文がありません。')
      return
    }

    try {
      await navigator.clipboard.writeText(generatedMinutesText)
      setMessage('議事録本文をコピーしました。')
      setErrorMessage('')
    } catch {
      setErrorMessage('コピーに失敗しました。')
    }
  }

  function handleDownloadTxt() {
    if (!generatedMinutesText.trim()) {
      setErrorMessage('保存する議事録本文がありません。')
      return
    }

    const fileName = (meetingName.trim() || generatedTitle.trim() || 'AI議事録') + '.txt'
    const plainText = buildPlainTextDocument({
      meetingType,
      meetingName: meetingName.trim() || generatedTitle.trim() || 'AI議事録',
      status: lastSavedStatus,
      minutesText: generatedMinutesText,
      supplementNote,
      transcriptText,
    })

    const blob = new Blob(['\uFEFF', plainText], {
      type: 'text/plain;charset=utf-8',
    })

    downloadBlob(blob, fileName)
    setMessage('TXTで保存しました。')
    setErrorMessage('')
  }

  function handleDownloadWord() {
    if (!generatedMinutesText.trim()) {
      setErrorMessage('保存する議事録本文がありません。')
      return
    }

    const fileName = (meetingName.trim() || generatedTitle.trim() || 'AI議事録') + '.doc'
    const html = buildWordHtmlDocument({
      meetingType,
      meetingName: meetingName.trim() || generatedTitle.trim() || 'AI議事録',
      status: lastSavedStatus,
      minutesText: generatedMinutesText,
      supplementNote,
      transcriptText,
    })

    const blob = new Blob(['\uFEFF', html], {
      type: 'application/msword;charset=utf-8',
    })

    downloadBlob(blob, fileName)
    setMessage('Word形式で保存しました。')
    setErrorMessage('')
  }

  function handlePrint() {
    if (!generatedMinutesText.trim()) {
      setErrorMessage('印刷する議事録本文がありません。')
      return
    }

    const printWindow = window.open('', '_blank', 'noopener,noreferrer')

    if (!printWindow) {
      setErrorMessage('印刷ウィンドウを開けませんでした。')
      return
    }

    const html = buildWordHtmlDocument({
      meetingType,
      meetingName: meetingName.trim() || generatedTitle.trim() || 'AI議事録',
      status: lastSavedStatus,
      minutesText: generatedMinutesText,
      supplementNote,
      transcriptText,
    })

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

  function handleOpenSavedRecord() {
    if (!lastSavedRecordId) {
      setErrorMessage('まだ保存済み議事録がありません。')
      return
    }

    router.push(
      `/properties/${propertyId}/cases/${caseId}/board-minutes-records/${lastSavedRecordId}`
    )
  }

  function handleOpenSavedList() {
    router.push(
      `/properties/${propertyId}/cases/${caseId}/board-minutes-records`
    )
  }

  return (
    <div className="space-y-6">
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
        <h2 className="text-lg font-bold text-gray-900">入力</h2>
        <p className="mt-2 text-sm text-gray-600">
          文字起こし全文と補足メモを入れて、AI議事録を生成します。
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">会議種別</span>
            <select
              value={meetingType}
              onChange={(event) => setMeetingType(event.target.value as MeetingType)}
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
              value={meetingName}
              onChange={(event) => setMeetingName(event.target.value)}
              placeholder="例：2026年4月定例理事会"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <label className="mt-4 block space-y-2">
          <span className="text-sm font-medium text-gray-700">文字起こし全文</span>
          <textarea
            value={transcriptText}
            onChange={(event) => setTranscriptText(event.target.value)}
            rows={12}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="文字起こし全文をここに貼ってください"
          />
        </label>

        <label className="mt-4 block space-y-2">
          <span className="text-sm font-medium text-gray-700">補足メモ</span>
          <textarea
            value={supplementNote}
            onChange={(event) => setSupplementNote(event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="補足で反映したい注意点があれば入力"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">書式</h2>
            <p className="mt-2 text-sm text-gray-600">
              会社標準をベースに、この物件だけの書式も保存できます。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleApplyCompanyStandard}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              会社標準に戻す
            </button>
            <button
              type="button"
              onClick={handleSavePropertyStandard}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              この物件の標準として保存
            </button>
            <button
              type="button"
              onClick={handleClearPropertyStandard}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              物件書式を削除
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">文体</span>
            <input
              value={formattingOptions.tone}
              onChange={(event) =>
                handleFormattingChange('tone', event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">見出し</span>
            <input
              value={formattingOptions.headingStyle}
              onChange={(event) =>
                handleFormattingChange('headingStyle', event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">粒度</span>
            <input
              value={formattingOptions.detailLevel}
              onChange={(event) =>
                handleFormattingChange('detailLevel', event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">文章の出し方</span>
            <input
              value={formattingOptions.proseStyle}
              onChange={(event) =>
                handleFormattingChange('proseStyle', event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              決定事項・宿題事項
            </span>
            <input
              value={formattingOptions.decisionRule}
              onChange={(event) =>
                handleFormattingChange('decisionRule', event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">定型表現ルール</span>
            <input
              value={formattingOptions.phraseRule}
              onChange={(event) =>
                handleFormattingChange('phraseRule', event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? '生成中…' : 'AI議事録を生成する'}
          </button>
        </div>
      </div>

      {generatedMinutesText ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">生成結果</h2>
                <p className="mt-2 text-sm text-gray-600">
                  ここで本文を微修正してから保存できます。
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  本文コピー
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
                  onClick={handleOpenSavedList}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  保存済み一覧へ
                </button>
                <button
                  type="button"
                  onClick={handleOpenSavedRecord}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  保存済み詳細を開く
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium text-gray-500">今回のタイトル</p>
                <p className="mt-2 text-sm font-bold text-gray-900">
                  {generatedTitle || '未設定'}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium text-gray-500">文体</p>
                <p className="mt-2 text-sm text-gray-900">{formattingApplied.tone}</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium text-gray-500">見出し</p>
                <p className="mt-2 text-sm text-gray-900">
                  {formattingApplied.headingStyle}
                </p>
              </div>
            </div>

            <label className="mt-5 block space-y-2">
              <span className="text-sm font-medium text-gray-700">議事録本文</span>
              <textarea
                value={generatedMinutesText}
                onChange={(event) => setGeneratedMinutesText(event.target.value)}
                rows={24}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleSave('draft')}
                disabled={isSavingDraft || isSavingFinal}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingDraft ? '下書き保存中…' : '下書き保存'}
              </button>
              <button
                type="button"
                onClick={() => void handleSave('final')}
                disabled={isSavingDraft || isSavingFinal}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingFinal ? '確定保存中…' : '確定保存'}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <h3 className="text-base font-bold text-amber-900">全体の宿題事項</h3>
              <div className="mt-3 space-y-2 text-sm text-amber-900">
                {actionItems.length > 0 ? (
                  actionItems.map((item, index) => <p key={`${item}-${index}`}>・{item}</p>)
                ) : (
                  <p>・特になし</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
              <h3 className="text-base font-bold text-blue-900">全体の確認要事項</h3>
              <div className="mt-3 space-y-2 text-sm text-blue-900">
                {confirmationItems.length > 0 ? (
                  confirmationItems.map((item, index) => (
                    <p key={`${item}-${index}`}>・{item}</p>
                  ))
                ) : (
                  <p>・特になし</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}