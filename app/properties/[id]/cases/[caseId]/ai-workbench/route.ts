import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export const runtime = 'nodejs'

type SafeRow = Record<string, unknown> & {
  id?: string
}

const MODE_ALIASES: Record<string, string> = {
  board_question_generator: 'expected_questions_generator',
  priority_judge: 'priority_judgement',
}

const MODE_CONFIG: Record<
  string,
  {
    label: string
    instruction: string
  }
> = {
  pdf_estimate_analysis: {
    label: 'PDF見積解析',
    instruction:
      '見積や添付ファイルの文脈を踏まえ、金額の大きい点、確認不足になりやすい点、理事会で聞かれそうな論点を短く整理してください。',
  },
  warranty_compare: {
    label: '保証内容比較',
    instruction:
      '保証期間、保証対象、除外事項、説明時の注意点を比較しやすい形に整理してください。',
  },
  work_scope_compare: {
    label: '工事項目比較',
    instruction:
      '工事項目の差分、含まれる作業、含まれない作業、比較時の着眼点を整理してください。',
  },
  estimate_comparison_table: {
    label: '見積比較表生成',
    instruction:
      '見積比較表として使えるよう、比較項目ごとに見やすく整理してください。',
  },
  estimate_comment_generator: {
    label: '見積比較コメント生成',
    instruction:
      '理事会や上司に説明しやすいよう、比較コメントを簡潔に作成してください。',
  },
  board_proposal_draft: {
    label: '理事会報告ドラフト',
    instruction:
      '理事会にそのまま出しやすいよう、背景、現状、提案内容、判断ポイントを含めてドラフト化してください。',
  },
  handover_report_draft: {
    label: '引き継ぎ報告書生成',
    instruction:
      '新担当者がすぐ動けるよう、現状、注意点、未完了事項、次アクションを明確にしてください。',
  },
  document_polisher: {
    label: '文書整形',
    instruction:
      'ラフな文を、管理会社の実務でそのまま使いやすい自然な日本語に整えてください。',
  },
  monthly_case_report: {
    label: '月次案件報告',
    instruction:
      '月次報告向けに、進捗、課題、今後の予定を見やすく整理してください。',
  },
  case_complaint_brief: {
    label: 'クレーム要約',
    instruction:
      'クレーム案件の経緯、論点、注意点、次の対応を短く要約してください。',
  },
  task_priority_suggester: {
    label: 'タスク優先度提案',
    instruction:
      '期限、影響、緊急度、関係者への影響を見て、タスクの優先順を提案してください。',
  },
  today_focus_extractor: {
    label: '今日やること抽出',
    instruction:
      '今日着手すべきものだけを絞り、理由付きで短く示してください。',
  },
  log_auto_tagging: {
    label: 'ログ自動タグ付け',
    instruction:
      'ログに付けるべき分類タグを提案し、重要なログを先に見つけやすくしてください。',
  },
  history_structuring: {
    label: '履歴の構造化',
    instruction:
      'バラバラの履歴を、流れが追いやすい順序で整理してください。',
  },
  case_story_builder: {
    label: '案件ストーリー化',
    instruction:
      '案件の始まりから現在までを、時系列で分かりやすくまとめてください。',
  },
  complaint_recurrence_alert: {
    label: 'クレーム再発警告',
    instruction:
      '再発しそうな点、火種になりそうな点、事前に打つべき対応を整理してください。',
  },
  similar_complaint_brief: {
    label: '類似クレーム表示',
    instruction:
      '今回と似ているクレームの観点を示し、参考にできる対応パターンを出してください。',
  },
  board_submission_alert: {
    label: '理事会提出推奨',
    instruction:
      '理事会へ上げるべきか、まだ現場調整でよいかを、根拠付きで整理してください。',
  },
  stale_update_alert: {
    label: '停滞アラート',
    instruction:
      '止まっている原因、放置リスク、次に動かすための一手を整理してください。',
  },
  priority_judgement: {
    label: '優先度判定',
    instruction:
      '案件の緊急度、重要度、炎上可能性を踏まえて総合判定してください。',
  },
  vendor_evaluation_brief: {
    label: '業者評価メモ',
    instruction:
      '業者の対応品質、レスポンス、見積の見やすさ、安心感を短く整理してください。',
  },
  estimate_history_analysis: {
    label: '見積履歴分析',
    instruction:
      '過去見積との比較視点で、今回の見積を見るべき点を整理してください。',
  },
  success_pattern_extractor: {
    label: '成功パターン抽出',
    instruction:
      'うまく進んだ対応の型を抽出し、再利用できる形にしてください。',
  },
  knowledge_capture_note: {
    label: 'ナレッジ化メモ',
    instruction:
      'この案件から学べる再利用知識を、短くナレッジメモ化してください。',
  },
  caution_message_builder: {
    label: '注意メッセージ作成',
    instruction:
      '角を立てすぎず、でも注意すべき点は伝わる文章を作成してください。',
  },
  recommended_action_builder: {
    label: 'おすすめ対応作成',
    instruction:
      'この案件を前に進めるための現実的な次アクションを整理してください。',
  },
  update_notice_draft: {
    label: '更新通知文',
    instruction:
      '理事長、役員、居住者向けに使いやすい進捗通知文を作成してください。',
  },
  deadline_notice_draft: {
    label: '期限通知文',
    instruction:
      '期限が近いことを丁寧かつ実務的に伝える文面を作成してください。',
  },
  assignee_notice_draft: {
    label: '担当変更通知文',
    instruction:
      '担当変更の連絡を、安心感が出るように丁寧に作成してください。',
  },
  general_notification_draft: {
    label: '汎用通知文',
    instruction:
      '幅広い通知に使えるベース文を、自然なビジネス日本語で作成してください。',
  },
  board_simulation: {
    label: 'AI理事会シミュレーション',
    instruction:
      '理事会でのやり取りをシミュレーションし、想定質問、切り返し例、詰まりやすい点、最後のまとめ方まで出してください。',
  },
  expected_questions_generator: {
    label: '想定質問生成',
    instruction:
      '理事長、役員、居住者から出そうな質問を厳しめに列挙し、それぞれに短い回答例を付けてください。',
  },
  board_explanation_script: {
    label: 'AI理事会説明文生成',
    instruction:
      '理事会で口頭説明しやすいよう、読み上げやすい自然な説明文を作成してください。',
  },
  missed_response_checker: {
    label: '対応抜けチェック',
    instruction:
      '今ある情報から、確認漏れ、連絡漏れ、提出漏れ、判断漏れを洗い出してください。',
  },
  future_task_generator: {
    label: '未来のタスク自動生成',
    instruction:
      '今後2週間から1か月で必要になりそうなタスクを予測し、優先順と理由付きで出してください。',
  },
  assignee_change_mode: {
    label: '担当者変更モード',
    instruction:
      '新担当が最初の3日で迷わないよう、引き継ぎ要点、危険ポイント、最初に確認すべきことを整理してください。',
  },
  similar_case_recommender: {
    label: '類似案件レコメンド',
    instruction:
      '今回案件と近い対応パターンを推測し、参考にできる進め方や注意点を提案してください。',
  },
  case_risk_deep_dive: {
    label: '案件リスク深掘り',
    instruction:
      '案件リスクを深掘りし、火種、悪化シナリオ、先回り策、理事会で突っ込まれやすい点を整理してください。',
  },
  resident_reply_draft: {
    label: '居住者返信ドラフト',
    instruction:
      '居住者へ返す文面を、丁寧で角が立ちにくく、でも曖昧すぎない形で作成してください。',
  },
  vendor_request_draft: {
    label: '業者依頼文ドラフト',
    instruction:
      '業者への依頼文や見積依頼文を、要件漏れが起きにくい形で作成してください。',
  },
}

function normalizeMode(rawMode: string) {
  if (!rawMode) return ''
  return MODE_ALIASES[rawMode] || rawMode
}

function createFallbackModeConfig(mode: string) {
  return {
    label: mode || '汎用案件AI',
    instruction:
      '案件情報、タスク、ログ、クレーム、添付ファイル、ユーザー補足を踏まえて、実務で使える形に整理してください。文案が必要なら完成文も含めてください。',
  }
}

function pickText(row: SafeRow | null | undefined, keys: string[], fallback = '-') {
  if (!row) return fallback

  for (const key of keys) {
    const value = row[key]

    if (typeof value === 'string' && value.trim()) {
      return value
    }

    if (typeof value === 'number') {
      return String(value)
    }
  }

  return fallback
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function summarizeRows(
  rows: SafeRow[] | null,
  builder: (row: SafeRow, index: number) => string
) {
  if (!rows || rows.length === 0) {
    return 'なし'
  }

  return rows.map((row, index) => builder(row, index)).join('\n')
}

function buildPropertySummary(property: SafeRow) {
  return [
    `物件名: ${pickText(property, ['name', 'property_name', 'title'], '-')}`,
    `住所: ${pickText(property, ['address'], '-')}`,
    `管理メモ: ${pickText(property, ['management_memo', 'memo', 'notes'], '-')}`,
    `理事会メモ: ${pickText(property, ['board_memo'], '-')}`,
    `注意事項: ${pickText(property, ['caution_note', 'important_note'], '-')}`,
  ].join('\n')
}

function buildCaseSummary(caseRow: SafeRow) {
  return [
    `案件名: ${pickText(caseRow, ['title', 'case_title', 'name'], '-')}`,
    `状態: ${pickText(caseRow, ['status'], '-')}`,
    `カテゴリ: ${pickText(caseRow, ['category'], '-')}`,
    `優先度: ${pickText(caseRow, ['priority'], '-')}`,
    `担当者: ${pickText(caseRow, ['assignee_name', 'assignee', 'owner_name'], '-')}`,
    `期限: ${pickText(caseRow, ['due_date', 'deadline', 'target_date'], '-')}`,
    `一言ステータス: ${pickText(caseRow, ['one_line_status', 'short_status'], '-')}`,
    `ゴール: ${pickText(caseRow, ['goal', 'target', 'purpose'], '-')}`,
    `要約: ${pickText(caseRow, ['summary', 'description', 'overview', 'memo', 'notes'], '-')}`,
    `理事会ステータス: ${pickText(caseRow, ['board_status', 'board_stage'], '-')}`,
    `上程予定月: ${pickText(caseRow, ['board_month', 'submission_month'], '-')}`,
    `リスク: ${pickText(caseRow, ['risk', 'risk_level'], '-')}`,
  ].join('\n')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; caseId: string }> }
) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY が設定されていません。' },
        { status: 500 }
      )
    }

    const { id, caseId } = await params
    const body = (await request.json().catch(() => null)) as
      | {
          mode?: string
          input?: string
        }
      | null

    const rawMode = body?.mode?.trim() || ''
    const mode = normalizeMode(rawMode)
    const input = body?.input?.trim() || ''

    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    if (!companyId) {
      return NextResponse.json(
        { error: '会社情報を取得できませんでした。' },
        { status: 401 }
      )
    }

    const [
      propertyResult,
      caseResult,
      tasksResult,
      logsResult,
      filesResult,
      complaintsResult,
    ] = await Promise.all([
      supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .eq('company_id', companyId)
        .maybeSingle(),
      supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .eq('property_id', id)
        .eq('company_id', companyId)
        .maybeSingle(),
      supabase
        .from('tasks')
        .select('*')
        .eq('case_id', caseId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('logs')
        .select('*')
        .eq('case_id', caseId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(25),
      supabase
        .from('case_files')
        .select('*')
        .eq('case_id', caseId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(15),
      supabase
        .from('complaints')
        .select('*')
        .eq('case_id', caseId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(15),
    ])

    if (!propertyResult.data || !caseResult.data) {
      return NextResponse.json(
        { error: '対象の物件または案件が見つかりません。' },
        { status: 404 }
      )
    }

    const property = propertyResult.data as SafeRow
    const caseRow = caseResult.data as SafeRow
    const tasks = (tasksResult.data || []) as SafeRow[]
    const logs = (logsResult.data || []) as SafeRow[]
    const files = (filesResult.data || []) as SafeRow[]
    const complaints = (complaintsResult.data || []) as SafeRow[]

    const tasksSummary = summarizeRows(tasks, (row, index) => {
      return `${index + 1}. タスク名: ${pickText(row, ['title', 'name'], '-')} / 状態: ${pickText(row, ['status'], '-')} / 優先度: ${pickText(row, ['priority'], '-')} / 期限: ${pickText(row, ['due_date', 'deadline'], '-')} / 担当: ${pickText(row, ['assignee_name', 'assignee'], '-')}`
    })

    const logsSummary = summarizeRows(logs, (row, index) => {
      return `${index + 1}. 日時: ${pickText(row, ['created_at', 'logged_at'], '-')} / 種別: ${pickText(row, ['type', 'log_type', 'category'], '-')} / 内容: ${pickText(row, ['content', 'message', 'description', 'memo'], '-')}`
    })

    const filesSummary = summarizeRows(files, (row, index) => {
      return `${index + 1}. ファイル名: ${pickText(row, ['file_name', 'name', 'title'], '-')} / 種別: ${pickText(row, ['file_type', 'category'], '-')} / 補足: ${pickText(row, ['memo', 'description'], '-')}`
    })

    const complaintsSummary = summarizeRows(complaints, (row, index) => {
      return `${index + 1}. 申出内容: ${pickText(row, ['title', 'content', 'summary'], '-')} / 種別: ${pickText(row, ['complaint_type', 'type'], '-')} / 再発フラグ: ${formatValue(row['recurrence_flag'] ?? row['is_recurring'])} / 状態: ${pickText(row, ['status'], '-')}`
    })

    const config = MODE_CONFIG[mode] || createFallbackModeConfig(rawMode || mode)

    const systemPrompt = [
      'あなたはマンション管理会社向けSaaSの実務特化AIです。',
      '対象読者はマンション管理会社のフロント担当です。',
      '出力は日本語で、実務でそのまま使える形にしてください。',
      '推測だけで断定せず、不足情報は「確認事項」として明示してください。',
      '余計な前置きは不要です。',
      '管理会社が上司、理事長、役員、居住者、業者へ説明しやすい文にしてください。',
      '箇条書きと短い見出しをうまく使い、コピペしやすくしてください。',
      `今回の役割: ${config.label}`,
      `今回の指示: ${config.instruction}`,
    ].join('\n')

    const userPrompt = [
      '【物件情報】',
      buildPropertySummary(property),
      '',
      '【案件情報】',
      buildCaseSummary(caseRow),
      '',
      '【関連タスク】',
      tasksSummary,
      '',
      '【関連ログ】',
      logsSummary,
      '',
      '【関連ファイル】',
      filesSummary,
      '',
      '【関連クレーム】',
      complaintsSummary,
      '',
      '【ユーザー補足メモ】',
      input || 'なし',
      '',
      '【出力ルール】',
      '1. 実務でそのまま使える内容にすること',
      '2. 長すぎず、でも薄すぎないこと',
      '3. 不足情報があれば最後に確認事項として短く出すこと',
      '4. 文案系はコピペできる完成文を含めること',
      '5. 判断系は理由を短く添えること',
    ].join('\n')

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const response = await openai.responses.create({
      model: 'gpt-5.4-mini',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: systemPrompt,
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: userPrompt,
            },
          ],
        },
      ],
    })

    const result = response.output_text?.trim()

    if (!result) {
      return NextResponse.json(
        { error: 'AIの結果が空でした。もう一度お試しください。' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      result,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'AI生成に失敗しました。'

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}