import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

type GenerateRequestBody = {
  title?: string
  currentContent?: string
}

type CaseRow = {
  id: string
  title: string | null
  status: string | null
  assignee: string | null
  created_at: string | null
  board_status: string | null
  board_scheduled_for: string | null
  board_agenda_title: string | null
  board_decision_status: string | null
  board_decision_date: string | null
  board_decision_note: string | null
  board_next_action: string | null
}

type TaskRow = {
  id: string
  title: string | null
  status: string | null
  due_date: string | null
  case_id: string | null
  priority: string | null
  created_at: string | null
}

type ComplaintRow = {
  id: string
  title: string | null
  detail: string | null
  status: string | null
  created_at: string | null
  property_id: string
}

type LogRow = {
  id: string
  case_id: string
  message: string | null
  created_at: string | null
  type: string | null
}

type PropertyRow = {
  id: string
  name?: string | null
  address?: string | null
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

function toJsonText(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function trimText(value: string | null | undefined, maxLength: number) {
  const text = (value || '').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

function priorityRank(priority: string | null | undefined) {
  if (priority === '高') return 0
  if (priority === '中') return 1
  if (priority === '低') return 2
  return 3
}

function sortTasksForHandover(tasks: TaskRow[]) {
  return [...tasks].sort((a, b) => {
    const priorityDiff = priorityRank(a.priority) - priorityRank(b.priority)
    if (priorityDiff !== 0) return priorityDiff

    const aDue = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER
    const bDue = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER
    if (aDue !== bDue) return aDue - bDue

    const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
    const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
    return bCreated - aCreated
  })
}

function createReferenceData(params: {
  property: PropertyRow | null
  cases: CaseRow[]
  tasks: TaskRow[]
  complaints: ComplaintRow[]
  logs: LogRow[]
}) {
  const { property, cases, tasks, complaints, logs } = params

  const unfinishedTasks = tasks.filter((task) => task.status !== '完了')
  const sortedUnfinishedTasks = sortTasksForHandover(unfinishedTasks)

  const overdueTasks = sortedUnfinishedTasks.filter((task) => {
    if (!task.due_date) return false
    const due = new Date(task.due_date)
    const today = new Date()
    due.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    return due < today
  })

  const boardRelatedCases = cases.filter(
    (item) =>
      Boolean(item.board_status) ||
      Boolean(item.board_agenda_title) ||
      Boolean(item.board_next_action)
  )

  const referenceData: AIReferenceData = {
    物件情報: {
      物件ID: property?.id || '不明',
      物件名: property?.name || '不明',
      住所: property?.address || '不明',
    },
    進行中案件一覧: cases.slice(0, 10).map((item) => ({
      案件名: item.title || '無題案件',
      状況: item.status || '不明',
      担当者: item.assignee || '未設定',
      理事会関連状況: item.board_status || '特記事項なし',
      理事会議案名: item.board_agenda_title || '未設定',
      次アクション: trimText(item.board_next_action, 80) || '未設定',
      作成日: formatDate(item.created_at),
    })),
    未完了タスク一覧: sortedUnfinishedTasks.slice(0, 12).map((item) => ({
      タスク名: item.title || '無題タスク',
      状況: item.status || '不明',
      期限: formatDate(item.due_date),
      優先度: item.priority || '未設定',
      関連案件ID: item.case_id || '未設定',
    })),
    期限切れタスク件数: overdueTasks.length,
    理事会関連案件件数: boardRelatedCases.length,
    クレーム一覧: complaints.slice(0, 8).map((item) => ({
      件名: item.title || '無題クレーム',
      状況: item.status || '不明',
      発生日: formatDate(item.created_at),
      内容要約: trimText(item.detail, 180) || '詳細なし',
    })),
    最近のログ一覧: logs.slice(0, 12).map((item) => ({
      日付: formatDate(item.created_at),
      種別: item.type || '不明',
      内容: trimText(item.message, 140) || '内容なし',
    })),
  }

  return referenceData
}

function buildPrompt(params: {
  currentTitle: string
  currentContent: string
  referenceData: AIReferenceData
}) {
  const { currentTitle, currentContent, referenceData } = params

  return `
あなたは、マンション管理会社のフロント担当者に引き継ぐための実務文書を作成するAIです。
目的は、次担当者が朝一で読んだ時に、何が進行中で、何が危険で、何から手を付けるべきかをすぐ理解できるようにすることです。
読みやすさと実務性を最優先してください。

【最重要ルール】
1. 出力は必ず日本語のプレーンテキストにしてください
2. 英語のカラム名や英語の変数名は絶対に本文へ出さないでください
3. 見出しは必ず以下の順で固定してください
【引き継ぎタイトル】
【物件概要】
【現在進行中の案件】
【未完了タスク】
【クレーム・注意事項】
【理事会で意識すべき事項】
【次担当者の初動】
【補足】

4. 各見出しの中では、短い段落または「・」の箇条書きを使って読みやすくしてください
5. 抽象的な表現を避け、次担当者が取る行動が想像できる文章にしてください
6. 存在しない事実は書かないでください
7. 情報が不足している箇所は「現時点で確認情報は限定的です」と明記してください
8. 総花的に全部同じ重さで書かず、優先順位が伝わるようにしてください
9. 期限切れタスク、停滞しそうな案件、クレーム、理事会関連は優先して触れてください
10. 【次担当者の初動】では、朝一で確認する順番を具体的に3〜5個書いてください
11. タイトルは今のタイトルをベースに、少し自然に整える程度にしてください
12. 「AIが生成しました」などの説明文は書かないでください
13. データ項目を説明する時は、日本語の自然な文章に言い換えてください
14. 箇条書きの先頭は「・」を使ってください
15. 「次担当者の初動」は特に具体的に書いてください

【悪い例】
・board_status が否決です
・board_next_action は業者連絡です

【良い例】
・理事会では否決扱いとなっているため、業者連絡の実施有無と今後の進め方を確認してください

【現在のタイトル】
${currentTitle || '引き継ぎ書'}

【現在の本文】
${currentContent || '未入力'}

【AIへ渡す参照データ】
${toJsonText(referenceData)}
`.trim()
}

function extractAssistantText(content: unknown) {
  if (typeof content === 'string') return content.trim()

  if (Array.isArray(content)) {
    const texts = content
      .map((item) => {
        if (
          item &&
          typeof item === 'object' &&
          'type' in item &&
          item.type === 'text' &&
          'text' in item &&
          typeof item.text === 'string'
        ) {
          return item.text
        }
        return ''
      })
      .filter(Boolean)

    return texts.join('\n').trim()
  }

  return ''
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: propertyId } = await context.params

    if (!propertyId) {
      return NextResponse.json(
        { error: '物件IDがありません。' },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY が設定されていません。.env.local を確認してください。' },
        { status: 500 }
      )
    }

    const body = (await request.json()) as GenerateRequestBody
    const currentTitle = (body.title || '引き継ぎ書').trim() || '引き継ぎ書'
    const currentContent = (body.currentContent || '').trim()

    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'ログインが必要です。' },
        { status: 401 }
      )
    }

    const companyId = await getUserCompanyId()

    if (!companyId) {
      return NextResponse.json(
        { error: '会社情報が取得できません。' },
        { status: 403 }
      )
    }

    const { data: property } = await supabase
      .from('properties')
      .select('id, name, address')
      .eq('id', propertyId)
      .eq('company_id', companyId)
      .maybeSingle()

    if (!property) {
      return NextResponse.json(
        { error: '対象の物件が見つかりません。' },
        { status: 404 }
      )
    }

    const { data: cases } = await supabase
      .from('cases')
      .select(
        'id, title, status, assignee, created_at, board_status, board_scheduled_for, board_agenda_title, board_decision_status, board_decision_date, board_decision_note, board_next_action'
      )
      .eq('property_id', propertyId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, due_date, case_id, priority, created_at')
      .eq('property_id', propertyId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    const { data: complaints } = await supabase
      .from('complaints')
      .select('id, title, detail, status, created_at, property_id')
      .eq('property_id', propertyId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    const caseIds = (cases ?? [])
      .map((item) => item.id)
      .filter((value): value is string => Boolean(value))

    let logs: LogRow[] = []

    if (caseIds.length > 0) {
      const { data: logData } = await supabase
        .from('logs')
        .select('id, case_id, message, created_at, type')
        .in('case_id', caseIds)
        .order('created_at', { ascending: false })
        .limit(20)

      logs = (logData ?? []) as LogRow[]
    }

    const referenceData = createReferenceData({
      property: (property as PropertyRow | null) ?? null,
      cases: ((cases ?? []) as CaseRow[]).slice(0, 20),
      tasks: ((tasks ?? []) as TaskRow[]).slice(0, 30),
      complaints: ((complaints ?? []) as ComplaintRow[]).slice(0, 20),
      logs,
    })

    const prompt = buildPrompt({
      currentTitle,
      currentContent,
      referenceData,
    })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)

    try {
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-5.4-mini',
          messages: [
            {
              role: 'system',
              content:
                'あなたはマンション管理会社向けの実務文書作成AIです。必ず日本語で、優先順位が明確で、次担当者がすぐ動ける詳細な引き継ぎ書を作成してください。英語の項目名は使わず、自然な日本語で書いてください。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_completion_tokens: 1800,
        }),
        signal: controller.signal,
      })

      const openAIJson = await openAIResponse.json()

      if (!openAIResponse.ok) {
        const message =
          openAIJson?.error?.message || 'OpenAI API の呼び出しに失敗しました。'
        return NextResponse.json({ error: message }, { status: 500 })
      }

      const assistantContent = extractAssistantText(
        openAIJson?.choices?.[0]?.message?.content
      )

      if (!assistantContent) {
        return NextResponse.json(
          { error: 'AIの返答が空でした。もう一度お試しください。' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        title: currentTitle,
        content: assistantContent,
        referenceData,
      })
    } finally {
      clearTimeout(timeout)
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : '引き継ぎAI生成中に不明なエラーが発生しました。'

      return NextResponse.json({ error: message }, { status: 500 })
  }
}