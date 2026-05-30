'use client'

import { useState } from 'react'

type HandoverEditorProps = {
  propertyId: string
  propertyName?: string | null
  initialTitle?: string | null
  initialContent?: string | null
  generatedContent?: string | null
  updatedAt?: string | null
}

type AIReferenceData = {
  物件情報: {
    物件ID: string
    物件名: string
    住所: string
  }
  進行中案件一覧: Array<{
    案件名: string
    状況: string
    担当者: string
    理事会関連状況: string
    理事会議案名: string
    次アクション: string
    作成日: string
  }>
  未完了タスク一覧: Array<{
    タスク名: string
    状況: string
    期限: string
    優先度: string
    関連案件ID: string
  }>
  期限切れタスク件数: number
  理事会関連案件件数: number
  クレーム一覧: Array<{
    件名: string
    状況: string
    発生日: string
    内容要約: string
  }>
  最近のログ一覧: Array<{
    日付: string
    種別: string
    内容: string
  }>
}

type GenerateResponse = {
  title: string
  content: string
  referenceData: AIReferenceData
}

function createDefaultTitle(value?: string | null) {
  const text = (value || '').trim()
  if (text) return text
  return '引き継ぎ書'
}

function createInitialContent(
  initialContent?: string | null,
  generatedContent?: string | null
) {
  const saved = (initialContent || '').trim()
  if (saved) return saved

  const generated = (generatedContent || '').trim()
  if (generated) return generated

  return ''
}

export default function HandoverEditor({
  propertyId,
  initialTitle,
  initialContent,
  generatedContent,
}: HandoverEditorProps) {
  const [title, setTitle] = useState(createDefaultTitle(initialTitle))
  const [content, setContent] = useState(
    createInitialContent(initialContent, generatedContent)
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')

  const [isGenerating, setIsGenerating] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [aiError, setAiError] = useState('')
  const [referenceData, setReferenceData] = useState<AIReferenceData | null>(null)
  const [showReferenceData, setShowReferenceData] = useState(true)

  async function handleSave() {
    try {
      setIsSaving(true)
      setSaveMessage('')
      setSaveError('')

      const response = await fetch(
        `/api/properties/${propertyId}/handover-document`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            content,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        setSaveError(result.error || '保存に失敗しました。')
        return
      }

      setSaveMessage('保存しました。')
    } catch {
      setSaveError('通信エラーが発生しました。時間をおいて再度お試しください。')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleGenerate() {
    try {
      setIsGenerating(true)
      setAiMessage('')
      setAiError('')
      setSaveMessage('')
      setSaveError('')

      const response = await fetch(`/api/properties/${propertyId}/handover-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          currentContent: content,
        }),
      })

      const result = (await response.json()) as
        | GenerateResponse
        | { error?: string }

      if (!response.ok) {
        setAiError(
          'error' in result && result.error
            ? result.error
            : 'AI生成に失敗しました。'
        )
        return
      }

      const successResult = result as GenerateResponse

      setTitle(successResult.title)
      setContent(successResult.content)
      setReferenceData(successResult.referenceData)
      setShowReferenceData(true)
      setAiMessage(
        'AI生成結果を本文に反映しました。参照データを確認して、必要に応じて本文を整えてから保存してください。'
      )
    } catch {
      setAiError('通信エラーが発生しました。時間をおいて再度お試しください。')
    } finally {
      setIsGenerating(false)
    }
  }

  function handleResetToInitial() {
    setTitle(createDefaultTitle(initialTitle))
    setContent(createInitialContent(initialContent, generatedContent))
    setAiMessage('初期表示の内容に戻しました。')
    setAiError('')
    setSaveMessage('')
    setSaveError('')
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <h2 className="text-lg font-bold text-blue-900">引き継ぎAI生成</h2>
        <p className="mt-2 text-sm leading-7 text-blue-800">
          この機能は、物件・案件・タスク・クレーム・ログをもとに、
          次担当者がすぐ動けるようにするための詳しい引き継ぎ書を生成します。
          生成後は、本文と参照データの両方を確認してから保存してください。
        </p>

        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? 'AI生成中...' : 'AIで引き継ぎ書を生成する'}
          </button>

          <button
            type="button"
            onClick={handleResetToInitial}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            初期表示に戻す
          </button>
        </div>

        {aiMessage ? (
          <div className="mt-3 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-medium text-blue-700">
            {aiMessage}
          </div>
        ) : null}

        {aiError ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {aiError}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-semibold text-gray-900">
          引き継ぎ書タイトル
        </label>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="引き継ぎ書タイトルを入力"
          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="block text-sm font-semibold text-gray-900">
            引き継ぎ本文
          </label>

          <button
            type="button"
            onClick={() => setShowReferenceData((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            {showReferenceData ? '参照データを閉じる' : '参照データを開く'}
          </button>
        </div>

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="ここに引き継ぎ本文を入力してください"
          rows={22}
          className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm leading-7 text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500"
        />

        {showReferenceData && referenceData ? (
          <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-base font-bold text-gray-900">AIが参照した元データ</h3>
            <p className="mt-2 text-sm leading-7 text-gray-600">
              英語のカラム名ではなく、日本語に整えた情報だけをAIへ渡しています。
              出力内容に違和感がある時は、まずここを確認してください。
            </p>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm font-bold text-gray-900">物件情報</p>
                <div className="mt-2 space-y-1 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold text-gray-900">物件ID：</span>
                    {referenceData.物件情報.物件ID}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">物件名：</span>
                    {referenceData.物件情報.物件名}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">住所：</span>
                    {referenceData.物件情報.住所}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-white p-4">
                  <p className="text-sm font-bold text-gray-900">進行中案件</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {referenceData.進行中案件一覧.length}件
                  </p>
                  <div className="mt-3 space-y-3">
                    {referenceData.進行中案件一覧.length === 0 ? (
                      <p className="text-sm text-gray-600">該当案件はありません。</p>
                    ) : (
                      referenceData.進行中案件一覧.map((item, index) => (
                        <div
                          key={`${item.案件名}-${index}`}
                          className="rounded-lg border border-gray-200 p-3"
                        >
                          <p className="text-sm font-semibold text-gray-900">
                            {item.案件名}
                          </p>
                          <div className="mt-2 space-y-1 text-xs text-gray-700">
                            <p>状況：{item.状況}</p>
                            <p>担当者：{item.担当者}</p>
                            <p>理事会関連状況：{item.理事会関連状況}</p>
                            <p>理事会議案名：{item.理事会議案名}</p>
                            <p>次アクション：{item.次アクション}</p>
                            <p>作成日：{item.作成日}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <p className="text-sm font-bold text-gray-900">未完了タスク</p>
                  <div className="mt-1 space-y-1 text-xs text-gray-500">
                    <p>未完了件数：{referenceData.未完了タスク一覧.length}件</p>
                    <p>期限切れ件数：{referenceData.期限切れタスク件数}件</p>
                  </div>
                  <div className="mt-3 space-y-3">
                    {referenceData.未完了タスク一覧.length === 0 ? (
                      <p className="text-sm text-gray-600">未完了タスクはありません。</p>
                    ) : (
                      referenceData.未完了タスク一覧.map((item, index) => (
                        <div
                          key={`${item.タスク名}-${index}`}
                          className="rounded-lg border border-gray-200 p-3"
                        >
                          <p className="text-sm font-semibold text-gray-900">
                            {item.タスク名}
                          </p>
                          <div className="mt-2 space-y-1 text-xs text-gray-700">
                            <p>状況：{item.状況}</p>
                            <p>期限：{item.期限}</p>
                            <p>優先度：{item.優先度}</p>
                            <p>関連案件ID：{item.関連案件ID}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-white p-4">
                  <p className="text-sm font-bold text-gray-900">クレーム</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {referenceData.クレーム一覧.length}件
                  </p>
                  <div className="mt-3 space-y-3">
                    {referenceData.クレーム一覧.length === 0 ? (
                      <p className="text-sm text-gray-600">クレームはありません。</p>
                    ) : (
                      referenceData.クレーム一覧.map((item, index) => (
                        <div
                          key={`${item.件名}-${index}`}
                          className="rounded-lg border border-gray-200 p-3"
                        >
                          <p className="text-sm font-semibold text-gray-900">
                            {item.件名}
                          </p>
                          <div className="mt-2 space-y-1 text-xs text-gray-700">
                            <p>状況：{item.状況}</p>
                            <p>発生日：{item.発生日}</p>
                            <p>内容要約：{item.内容要約}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <p className="text-sm font-bold text-gray-900">最近のログ</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {referenceData.最近のログ一覧.length}件
                  </p>
                  <div className="mt-3 space-y-3">
                    {referenceData.最近のログ一覧.length === 0 ? (
                      <p className="text-sm text-gray-600">ログはありません。</p>
                    ) : (
                      referenceData.最近のログ一覧.map((item, index) => (
                        <div
                          key={`${item.日付}-${index}`}
                          className="rounded-lg border border-gray-200 p-3"
                        >
                          <div className="space-y-1 text-xs text-gray-700">
                            <p>日付：{item.日付}</p>
                            <p>種別：{item.種別}</p>
                            <p>内容：{item.内容}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-4">
                <p className="text-sm font-bold text-gray-900">理事会関連</p>
                <div className="mt-2 space-y-1 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold text-gray-900">理事会関連案件件数：</span>
                    {referenceData.理事会関連案件件数}件
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? '保存中...' : '保存する'}
        </button>
      </div>

      {saveMessage ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {saveMessage}
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {saveError}
        </div>
      ) : null}
    </div>
  )
}