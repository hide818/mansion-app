'use client'

import { useMemo, useState } from 'react'

export type CaseAiMode = string

type Props = {
  propertyId: string
  caseId: string
  mode: CaseAiMode
  title: string
  description: string
  placeholder?: string
  inputLabel?: string
  submitLabel?: string
  buttonText?: string
  resultTitle?: string
  tips?: string[]
}

const MODE_LABEL: Record<string, string> = {
  pdf_estimate_analysis: 'PDF見積解析',
  warranty_compare: '保証内容比較',
  work_scope_compare: '工事項目比較',
  estimate_comparison_table: '見積比較表生成',
  estimate_comment_generator: '見積比較コメント生成',
  board_proposal_draft: '理事会報告ドラフト',
  handover_report_draft: '引き継ぎ報告書生成',
  document_polisher: '文書整形',
  monthly_case_report: '月次案件報告',
  case_complaint_brief: 'クレーム要約',
  task_priority_suggester: 'タスク優先度提案',
  today_focus_extractor: '今日やること抽出',
  log_auto_tagging: 'ログ自動タグ付け',
  history_structuring: '履歴の構造化',
  case_story_builder: '案件ストーリー化',
  complaint_recurrence_alert: 'クレーム再発警告',
  similar_complaint_brief: '類似クレーム表示',
  board_submission_alert: '理事会提出推奨',
  stale_update_alert: '停滞アラート',
  priority_judgement: '優先度判定',
  priority_judge: '優先度判定',
  vendor_evaluation_brief: '業者評価メモ',
  estimate_history_analysis: '見積履歴分析',
  success_pattern_extractor: '成功パターン抽出',
  knowledge_capture_note: 'ナレッジ化メモ',
  caution_message_builder: '注意メッセージ作成',
  recommended_action_builder: 'おすすめ対応作成',
  update_notice_draft: '更新通知文',
  deadline_notice_draft: '期限通知文',
  assignee_notice_draft: '担当変更通知文',
  general_notification_draft: '汎用通知文',
  board_simulation: 'AI理事会シミュレーション',
  board_question_generator: '想定質問生成',
  expected_questions_generator: '想定質問生成',
  board_explanation_script: 'AI理事会説明文生成',
  missed_response_checker: '対応抜けチェック',
  future_task_generator: '未来のタスク自動生成',
  assignee_change_mode: '担当者変更モード',
  similar_case_recommender: '類似案件レコメンド',
  case_risk_deep_dive: '案件リスク深掘り',
  resident_reply_draft: '居住者返信ドラフト',
  vendor_request_draft: '業者依頼文ドラフト',
}

function getModeLabel(mode: string) {
  return MODE_LABEL[mode] || mode.replaceAll('_', ' ')
}

export default function CaseAiWorkbenchClient({
  propertyId,
  caseId,
  mode,
  title,
  description,
  placeholder = '補足したい事情、相手に伝えたい温度感、今回特に見てほしい点があれば自由に入力してください。',
  inputLabel = '補足メモ',
  submitLabel,
  buttonText,
  resultTitle = 'AI生成結果',
  tips = [],
}: Props) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const endpoint = useMemo(() => {
    return `/api/properties/${propertyId}/cases/${caseId}/ai-workbench`
  }, [propertyId, caseId])

  const primaryButtonLabel = buttonText || submitLabel || 'AIで作成する'
  const modeLabel = getModeLabel(mode)

  async function handleSubmit() {
    setIsLoading(true)
    setError('')
    setIsCopied(false)

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode,
          input,
        }),
      })

      const data = (await response.json()) as {
        result?: string
        error?: string
      }

      if (!response.ok) {
        setError(data.error || 'AI生成に失敗しました。')
        setResult('')
        return
      }

      setResult(data.result || '')
    } catch {
      setError('通信に失敗しました。開発サーバーの状態を確認してください。')
      setResult('')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCopy() {
    if (!result) return

    try {
      await navigator.clipboard.writeText(result)
      setIsCopied(true)

      window.setTimeout(() => {
        setIsCopied(false)
      }, 1500)
    } catch {
      setError('コピーに失敗しました。手動で選択してコピーしてください。')
    }
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-sm">
        <div className="p-6 md:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              案件AIワークベンチ
            </span>
            <span className="inline-flex rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-semibold text-cyan-100">
              {modeLabel}
            </span>
          </div>

          <h1 className="text-2xl font-bold md:text-3xl">
            {title}
          </h1>

          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-200">
            {description}
          </p>
        </div>
      </div>

      {tips.length > 0 ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-amber-900">
            このAIでできること
          </h2>

          <ul className="mt-4 space-y-2 text-sm leading-6 text-amber-900">
            {tips.map((tip, index) => (
              <li key={`${tip}-${index}`} className="flex gap-2">
                <span className="mt-0.5 font-bold">・</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block">
          <div className="mb-2 text-sm font-bold text-slate-900">
            {inputLabel}
          </div>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={placeholder}
            className="min-h-[220px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'AI生成中...' : primaryButtonLabel}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!result}
            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCopied ? 'コピーしました' : '結果をコピー'}
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">
            {resultTitle}
          </h2>

          <span className="text-xs font-semibold text-slate-500">
            コピペしやすい形で出力
          </span>
        </div>

        <div className="min-h-[260px] rounded-2xl bg-slate-50 p-4">
          {result ? (
            <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">
              {result}
            </pre>
          ) : (
            <div className="text-sm leading-7 text-slate-500">
              ここにAIの結果が表示されます。
            </div>
          )}
        </div>
      </div>
    </div>
  )
}