import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

type PackInput = {
  agendaTitleInput?: string
  boardStatus?: string
  scheduledMonth?: string
  meetingType?: string
  tone?: string
  boardMemo?: string
  focusPoints?: string
}

type PackOutput = {
  agendaizedSummary: string
  agendaTitle: string
  boardStatusNote: string
  scheduledMonthNote: string
  boardMemoDraft: string
  boardReportDraft: string
  proposalDraft: string
  aiAgendaDraft: string
  likelyQuestions: string[]
  expectedQuestions: string[]
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function safeText(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function pickFirstString(obj: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

function normalizeTask(task: Record<string, unknown>) {
  const title = pickFirstString(task, ['title', 'name', 'task_name', 'subject'])
  const status = pickFirstString(task, ['status'])
  const priority = pickFirstString(task, ['priority'])
  const dueDate = pickFirstString(task, ['due_date', 'deadline', 'dueAt'])
  return `・${title || 'タスク名未設定'} / 状態:${status || '未設定'} / 優先度:${priority || '未設定'} / 期限:${dueDate || '未設定'}`
}

function normalizeLog(log: Record<string, unknown>) {
  const content = pickFirstString(log, ['content', 'body', 'message', 'note'])
  const logType = pickFirstString(log, ['type', 'log_type', 'category'])
  const createdAt = pickFirstString(log, ['created_at', 'logged_at', 'date'])
  return `・${createdAt || '日時未設定'} / ${logType || '種別未設定'} / ${content || '内容なし'}`
}

function normalizeComplaint(complaint: Record<string, unknown>) {
  const title = pickFirstString(complaint, ['title', 'subject', 'name'])
  const status = pickFirstString(complaint, ['status'])
  const summary = pickFirstString(complaint, ['summary', 'content', 'body'])
  return `・${title || 'クレーム'} / 状態:${status || '未設定'} / ${summary || '詳細なし'}`
}

function extractJsonObject(text: string) {
  const trimmed = text.trim()

  if (!trimmed) {
    return null
  }

  try {
    return JSON.parse(trimmed)
  } catch {
    // そのまま継続
  }

  const codeFenceMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/i)
  if (codeFenceMatch?.[1]) {
    try {
      return JSON.parse(codeFenceMatch[1])
    } catch {
      // そのまま継続
    }
  }

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const maybeJson = trimmed.slice(firstBrace, lastBrace + 1)
    try {
      return JSON.parse(maybeJson)
    } catch {
      return null
    }
  }

  return null
}

function buildFallbackPack(args: {
  caseTitle: string
  caseStatus: string
  caseCategory: string
  casePriority: string
  caseDueDate: string
  propertyName: string
  meetingType: string
  boardStatus: string
  scheduledMonth: string
  agendaTitleInput: string
  boardMemo: string
  focusPoints: string
  taskLines: string[]
  logLines: string[]
  complaintLines: string[]
}): PackOutput {
  const {
    caseTitle,
    caseStatus,
    caseCategory,
    casePriority,
    caseDueDate,
    propertyName,
    meetingType,
    boardStatus,
    scheduledMonth,
    agendaTitleInput,
    boardMemo,
    focusPoints,
    taskLines,
    logLines,
    complaintLines,
  } = args

  const chosenAgendaTitle =
    agendaTitleInput ||
    `${caseTitle}に関する件`

  const tasksText =
    taskLines.length > 0
      ? taskLines.slice(0, 5).join('\n')
      : '・未完了タスク情報は特に取得されていません。'

  const logsText =
    logLines.length > 0
      ? logLines.slice(0, 4).join('\n')
      : '・直近ログ情報は特に取得されていません。'

  const complaintsText =
    complaintLines.length > 0
      ? complaintLines.slice(0, 3).join('\n')
      : '・関連クレーム情報は特に取得されていません。'

  return {
    agendaizedSummary:
      `${propertyName}における「${caseTitle}」について、${meetingType}に付議する前提で整理したものです。` +
      `現在の案件ステータスは「${caseStatus || '未設定'}」、理事会ステータスは「${boardStatus || '未設定'}」であり、` +
      `カテゴリは「${caseCategory || '未設定'}」、優先度は「${casePriority || '未設定'}」です。` +
      `理事会では、実施の必要性、居住者影響、費用感、今後の進め方を中心に説明すると通しやすいです。`,

    agendaTitle: chosenAgendaTitle,

    boardStatusNote:
      `本案件の理事会ステータスは「${boardStatus || '未設定'}」です。現時点では案件の状況、必要性、` +
      `想定される影響範囲を整理し、理事会での説明準備を進める段階です。案件期限は「${caseDueDate || '未設定'}」です。`,

    scheduledMonthNote:
      `上程予定月は「${scheduledMonth || '未設定'}」です。月次進行を踏まえると、` +
      `資料準備、見積確認、理事長説明の順で前倒ししておくと安全です。`,

    boardMemoDraft:
      [
        `【理事会メモ】`,
        `・案件名：${caseTitle}`,
        `・理事会ステータス：${boardStatus || '未設定'}`,
        `・上程予定月：${scheduledMonth || '未設定'}`,
        `・重視論点：${focusPoints || '未設定'}`,
        `・補足メモ：${boardMemo || '未入力'}`,
        '',
        `【未完了タスク】`,
        tasksText,
        '',
        `【直近ログ】`,
        logsText,
        '',
        `【関連クレーム】`,
        complaintsText,
      ].join('\n'),

    boardReportDraft:
      `管理会社より、${caseTitle}について説明を行うものです。` +
      `本案件は現在「${caseStatus || '未設定'}」の状態にあり、必要性及び今後の進め方について理事会で共有する必要があります。` +
      `特に、${focusPoints || '費用感・緊急性・居住者影響'}を中心に説明し、理事会のご意見を伺いたい内容です。`,

    proposalDraft:
      `議長の指名により管理会社から、${caseTitle}について説明がなされた。` +
      `本件は、現時点での状況、必要性、今後の対応方針を踏まえ、${meetingType}に上程するものである。` +
      `審議の結果、今後の進め方について確認し、必要に応じて見積取得、関係者調整、次回会議への継続審議を行うこととした。`,

    aiAgendaDraft:
      `第◯号議案 ${chosenAgendaTitle}\n` +
      `管理会社より、${caseTitle}について説明を行った。` +
      `現在の案件状況は「${caseStatus || '未設定'}」であり、期限は「${caseDueDate || '未設定'}」である。` +
      `理事会では、実施の必要性、想定費用、居住者影響、今後のスケジュールを中心に協議いただきたい。`,

    likelyQuestions: [
      `なぜ今このタイミングで${meetingType}に出す必要があるのか。`,
      `居住者への影響はどの程度あるのか。`,
      `費用はどのくらいを想定しているのか。`,
      `他に選択肢や比較案はあるのか。`,
      `承認後のスケジュールはどうなるのか。`,
    ],

    expectedQuestions: [
      `見積や金額の妥当性はどう説明するか。`,
      `緊急性が低い場合に先送りしてよいのか。`,
      `反対意見が出た場合の代替案はあるか。`,
      `関連する過去対応や類似案件はあるか。`,
      `理事長や役員へ事前共有すべき点は何か。`,
    ],
  }
}

function toPackOutput(raw: Record<string, unknown>, fallback: PackOutput): PackOutput {
  const likelyQuestions = Array.isArray(raw.likelyQuestions)
    ? raw.likelyQuestions.map((item) => safeText(item)).filter(Boolean)
    : fallback.likelyQuestions

  const expectedQuestions = Array.isArray(raw.expectedQuestions)
    ? raw.expectedQuestions.map((item) => safeText(item)).filter(Boolean)
    : fallback.expectedQuestions

  return {
    agendaizedSummary: safeText(raw.agendaizedSummary) || fallback.agendaizedSummary,
    agendaTitle: safeText(raw.agendaTitle) || fallback.agendaTitle,
    boardStatusNote: safeText(raw.boardStatusNote) || fallback.boardStatusNote,
    scheduledMonthNote: safeText(raw.scheduledMonthNote) || fallback.scheduledMonthNote,
    boardMemoDraft: safeText(raw.boardMemoDraft) || fallback.boardMemoDraft,
    boardReportDraft: safeText(raw.boardReportDraft) || fallback.boardReportDraft,
    proposalDraft: safeText(raw.proposalDraft) || fallback.proposalDraft,
    aiAgendaDraft: safeText(raw.aiAgendaDraft) || fallback.aiAgendaDraft,
    likelyQuestions,
    expectedQuestions,
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: propertyId, caseId } = await context.params
    const body = (await request.json()) as PackInput

    const agendaTitleInput = safeText(body.agendaTitleInput).trim()
    const boardStatus = safeText(body.boardStatus).trim() || '上程前'
    const scheduledMonth = safeText(body.scheduledMonth).trim()
    const meetingType = safeText(body.meetingType).trim() || '理事会'
    const tone = safeText(body.tone).trim() || '実務的'
    const boardMemo = safeText(body.boardMemo).trim()
    const focusPoints = safeText(body.focusPoints).trim()

    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .eq('company_id', companyId)
      .maybeSingle()

    if (!property) {
      return NextResponse.json(
        { error: '物件が見つかりません。' },
        { status: 404 }
      )
    }

    const { data: caseRow } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .eq('property_id', propertyId)
      .eq('company_id', companyId)
      .maybeSingle()

    if (!caseRow) {
      return NextResponse.json(
        { error: '案件が見つかりません。' },
        { status: 404 }
      )
    }

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('company_id', companyId)
      .eq('property_id', propertyId)
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(30)

    const { data: logs } = await supabase
      .from('logs')
      .select('*')
      .eq('company_id', companyId)
      .eq('property_id', propertyId)
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(30)

    const { data: complaints } = await supabase
      .from('complaints')
      .select('*')
      .eq('company_id', companyId)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(20)

    const propertyName =
      pickFirstString(property as Record<string, unknown>, ['name', 'property_name', 'title']) ||
      '物件'

    const caseTitle =
      pickFirstString(caseRow as Record<string, unknown>, ['title', 'name', 'subject']) ||
      '案件'

    const caseStatus =
      pickFirstString(caseRow as Record<string, unknown>, ['status']) ||
      '未設定'

    const caseCategory =
      pickFirstString(caseRow as Record<string, unknown>, ['category']) ||
      '未設定'

    const casePriority =
      pickFirstString(caseRow as Record<string, unknown>, ['priority']) ||
      '未設定'

    const caseDueDate =
      pickFirstString(caseRow as Record<string, unknown>, ['due_date', 'deadline']) ||
      '未設定'

    const taskLines = Array.isArray(tasks)
      ? tasks.map((item) => normalizeTask(item as Record<string, unknown>))
      : []

    const logLines = Array.isArray(logs)
      ? logs.map((item) => normalizeLog(item as Record<string, unknown>))
      : []

    const complaintLines = Array.isArray(complaints)
      ? complaints.map((item) => normalizeComplaint(item as Record<string, unknown>))
      : []

    const fallbackPack = buildFallbackPack({
      caseTitle,
      caseStatus,
      caseCategory,
      casePriority,
      caseDueDate,
      propertyName,
      meetingType,
      boardStatus,
      scheduledMonth,
      agendaTitleInput,
      boardMemo,
      focusPoints,
      taskLines,
      logLines,
      complaintLines,
    })

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(fallbackPack)
    }

    const prompt = [
      `あなたはマンション管理会社向けSaaSの理事会文書作成補助AIです。`,
      `日本語で、実務にそのまま使いやすい文書を作成してください。`,
      `必ず純粋なJSONのみを返してください。説明文、コードブロック、前置きは禁止です。`,
      ``,
      `【出力するJSONキー】`,
      `agendaizedSummary: string`,
      `agendaTitle: string`,
      `boardStatusNote: string`,
      `scheduledMonthNote: string`,
      `boardMemoDraft: string`,
      `boardReportDraft: string`,
      `proposalDraft: string`,
      `aiAgendaDraft: string`,
      `likelyQuestions: string[]`,
      `expectedQuestions: string[]`,
      ``,
      `【文体ルール】`,
      `・管理会社の実務で使える日本語`,
      `・回りくどすぎない`,
      `・理事会提出前の整理に向く`,
      `・曖昧な表現を減らす`,
      `・likelyQuestions と expectedQuestions は各5件`,
      ``,
      `【会議条件】`,
      `会議種別: ${meetingType}`,
      `文体の雰囲気: ${tone}`,
      `理事会ステータス: ${boardStatus}`,
      `上程予定月: ${scheduledMonth || '未設定'}`,
      `入力済み議案タイトル: ${agendaTitleInput || '未入力'}`,
      `重視論点: ${focusPoints || '未入力'}`,
      `補足メモ: ${boardMemo || '未入力'}`,
      ``,
      `【物件情報】`,
      `物件名: ${propertyName}`,
      ``,
      `【案件情報】`,
      `案件名: ${caseTitle}`,
      `案件ステータス: ${caseStatus}`,
      `カテゴリ: ${caseCategory}`,
      `優先度: ${casePriority}`,
      `期限: ${caseDueDate}`,
      `案件データ抜粋: ${JSON.stringify(caseRow)}`,
      ``,
      `【未完了タスク・関連タスク】`,
      taskLines.length > 0 ? taskLines.join('\n') : '情報なし',
      ``,
      `【直近ログ】`,
      logLines.length > 0 ? logLines.join('\n') : '情報なし',
      ``,
      `【関連クレーム】`,
      complaintLines.length > 0 ? complaintLines.join('\n') : '情報なし',
      ``,
      `【作ってほしい内容の意味】`,
      `agendaizedSummary: 案件を理事会に出せる形に整理した要約`,
      `agendaTitle: そのまま使いやすい議案タイトル`,
      `boardStatusNote: 今の理事会ステータス説明`,
      `scheduledMonthNote: 上程予定月についての整理`,
      `boardMemoDraft: 担当者用メモ`,
      `boardReportDraft: 理事会報告用の説明文`,
      `proposalDraft: 議案書向け下書き`,
      `aiAgendaDraft: 第◯号議案として使いやすい本文`,
      `likelyQuestions: 役員から飛びやすい質問`,
      `expectedQuestions: 事前準備用の想定質問`,
    ].join('\n')

    const response = await openai.responses.create({
      model: 'gpt-5.4-mini',
      input: [
        {
          role: 'system',
          content: 'あなたは実務向けの文書作成AIです。必ずJSONのみを返します。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const text = safeText((response as { output_text?: string }).output_text)
    const parsed = extractJsonObject(text)

    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json(fallbackPack)
    }

    const pack = toPackOutput(parsed as Record<string, unknown>, fallbackPack)

    return NextResponse.json(pack)
  } catch (error) {
    console.error('board-pack route error:', error)
    return NextResponse.json(
      { error: '理事会パックの生成に失敗しました。' },
      { status: 500 }
    )
  }
}