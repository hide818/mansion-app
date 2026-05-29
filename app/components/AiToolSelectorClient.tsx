'use client'

import { useState } from 'react'
import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type ModeItem = {
  mode: string
  label: string
  description: string
}

type Category = {
  key: string
  label: string
  modes: ModeItem[]
}

const CATEGORIES: Category[] = [
  {
    key: 'board',
    label: '理事会準備',
    modes: [
      {
        mode: 'board_simulation',
        label: 'AI理事会シミュレーション',
        description: '理事会の質疑応答と切り返しをシミュレーション',
      },
      {
        mode: 'expected_questions_generator',
        label: '想定質問生成',
        description: '理事長・役員から来そうな質問を厳しめに列挙',
      },
      {
        mode: 'board_explanation_script',
        label: '理事会説明文生成',
        description: '口頭説明用の読み上げやすい文を作成',
      },
      {
        mode: 'board_proposal_draft',
        label: '理事会報告ドラフト',
        description: '背景・提案・判断ポイントを含むドラフト',
      },
      {
        mode: 'missed_response_checker',
        label: '対応抜けチェック',
        description: '確認漏れ・連絡漏れ・提出漏れを洗い出す',
      },
      {
        mode: 'board_submission_alert',
        label: '理事会提出判断',
        description: '理事会へ上げるべきかを根拠付きで整理',
      },
    ],
  },
  {
    key: 'vendor',
    label: '業者・見積',
    modes: [
      {
        mode: 'pdf_estimate_analysis',
        label: 'PDF見積解析',
        description: '金額・確認点・理事会で聞かれる論点を整理',
      },
      {
        mode: 'estimate_comparison_table',
        label: '見積比較表生成',
        description: '比較項目ごとに見やすく整理',
      },
      {
        mode: 'estimate_comment_generator',
        label: '見積比較コメント',
        description: '理事会・上司に説明しやすいコメントを作成',
      },
      {
        mode: 'vendor_request_draft',
        label: '業者依頼文',
        description: '要件漏れが起きにくい依頼文を作成',
      },
      {
        mode: 'vendor_evaluation_brief',
        label: '業者評価メモ',
        description: '対応品質・レスポンス・安心感を短く整理',
      },
      {
        mode: 'warranty_compare',
        label: '保証内容比較',
        description: '保証期間・対象・除外事項を比較しやすく整理',
      },
    ],
  },
  {
    key: 'resident',
    label: '居住者・通知',
    modes: [
      {
        mode: 'resident_reply_draft',
        label: '居住者返信ドラフト',
        description: '丁寧で角の立たない返信文を作成',
      },
      {
        mode: 'update_notice_draft',
        label: '進捗通知文',
        description: '理事長・役員・居住者向けの進捗通知文',
      },
      {
        mode: 'deadline_notice_draft',
        label: '期限通知文',
        description: '期限が近いことを丁寧かつ実務的に伝える文面',
      },
      {
        mode: 'caution_message_builder',
        label: '注意メッセージ',
        description: '角を立てずに注意点が伝わる文章を作成',
      },
      {
        mode: 'general_notification_draft',
        label: '汎用通知文',
        description: '幅広い通知に使えるベース文を作成',
      },
    ],
  },
  {
    key: 'analysis',
    label: '案件分析',
    modes: [
      {
        mode: 'priority_judgement',
        label: '優先度判定',
        description: '緊急度・重要度・炎上可能性を踏まえて総合判定',
      },
      {
        mode: 'case_risk_deep_dive',
        label: 'リスク深掘り',
        description: '悪化シナリオ・先回り策・突っ込まれやすい点を整理',
      },
      {
        mode: 'stale_update_alert',
        label: '停滞アラート',
        description: '止まっている原因と次に動かすための一手を整理',
      },
      {
        mode: 'today_focus_extractor',
        label: '今日やること抽出',
        description: '今日着手すべきものだけを理由付きで絞り込む',
      },
      {
        mode: 'case_story_builder',
        label: '案件ストーリー化',
        description: '始まりから現在までを時系列でまとめる',
      },
    ],
  },
  {
    key: 'handover',
    label: '引き継ぎ・担当変更',
    modes: [
      {
        mode: 'handover_report_draft',
        label: '引き継ぎ報告書',
        description: '現状・注意点・未完了事項・次アクションを明確化',
      },
      {
        mode: 'assignee_change_mode',
        label: '担当変更モード',
        description: '新担当が最初の3日で迷わない引き継ぎ要点を整理',
      },
      {
        mode: 'assignee_notice_draft',
        label: '担当変更通知文',
        description: '安心感が出るよう丁寧に担当変更を伝える文章',
      },
      {
        mode: 'future_task_generator',
        label: '未来タスク予測',
        description: '今後2週間〜1ヶ月で必要になりそうなタスクを予測',
      },
    ],
  },
  {
    key: 'knowledge',
    label: 'ナレッジ・共有',
    modes: [
      {
        mode: 'knowledge_capture_note',
        label: 'ナレッジ化メモ',
        description: 'この案件から学べる知識を再利用できる形にメモ化',
      },
      {
        mode: 'success_pattern_extractor',
        label: '成功パターン抽出',
        description: 'うまく進んだ対応の型を抽出して再利用できる形に',
      },
      {
        mode: 'monthly_case_report',
        label: '月次案件報告',
        description: '進捗・課題・今後の予定を月次報告向けに整理',
      },
      {
        mode: 'document_polisher',
        label: '文書整形',
        description: 'ラフな文を実務でそのまま使える日本語に整える',
      },
    ],
  },
]

type Props = {
  propertyId: string
  caseId: string
}

export default function AiToolSelectorClient({ propertyId, caseId }: Props) {
  const [activeCategoryKey, setActiveCategoryKey] = useState(CATEGORIES[0].key)
  const [activeTool, setActiveTool] = useState<ModeItem | null>(null)

  const activeCategory = CATEGORIES.find((c) => c.key === activeCategoryKey) ?? CATEGORIES[0]

  if (activeTool) {
    return (
      <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTool(null)}
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← ツール選択に戻る
          </button>
          <div>
            <p className="text-sm font-bold text-gray-900">{activeTool.label}</p>
            <p className="text-xs text-gray-500">{activeTool.description}</p>
          </div>
        </div>

        <CaseAiWorkbenchClient
          propertyId={propertyId}
          caseId={caseId}
          mode={activeTool.mode}
          title={activeTool.label}
          description={activeTool.description}
        />
      </section>
    )
  }

  return (
    <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">AI工具箱</h2>
        <p className="mt-1 text-sm text-gray-600">
          カテゴリを選んでツールを起動してください。
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.key}
            type="button"
            onClick={() => setActiveCategoryKey(category.key)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeCategoryKey === category.key
                ? 'bg-green-600 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {activeCategory.modes.map((tool) => (
          <button
            key={tool.mode}
            type="button"
            onClick={() => setActiveTool(tool)}
            className="rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-green-300 hover:bg-green-50"
          >
            <p className="text-sm font-bold text-gray-900">{tool.label}</p>
            <p className="mt-1 text-xs leading-5 text-gray-500">{tool.description}</p>
          </button>
        ))}
      </div>
    </section>
  )
}
