import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { generateOpenAIText } from '@/lib/openaiText'

type RouteContext = {
  params: Promise<{ id: string }>
}

type MemoryRequestBody = {
  question?: unknown
}

// property_cards のカラム（handover-ai/page.tsx の SELECT で確認済み）
type PropertyCardRow = {
  management_memo: string | null
  board_memo: string | null
  resident_memo: string | null
  caution_note: string | null
  special_rule: string | null
  annual_schedule_memo: string | null
  chairman_memo: string | null
  officers_memo: string | null
  contact_memo: string | null
  past_trouble_summary: string | null
  pinned_note: string | null
}

function getMeetingTypeLabel(type: string | null): string {
  if (type === 'board_meeting') return '理事会'
  if (type === 'general_meeting') return '総会'
  return type ?? '会議'
}

function toDateStr(value: string | null | undefined): string {
  return String(value ?? '').split('T')[0] || '不明'
}

function safeText(value: string | null | undefined): string {
  return (value ?? '').trim()
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id: propertyId } = await context.params
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    // バリデーション
    const body = (await req.json()) as MemoryRequestBody
    const question = typeof body.question === 'string' ? body.question.trim() : ''
    if (!question) {
      return NextResponse.json(
        { error: '質問を入力してください。' },
        { status: 400 },
      )
    }

    // 物件の存在確認
    const { data: property } = await supabase
      .from('properties')
      .select(`
        id,
        name,
        address,
        bylaws_article,
        owners_total_count,
        voting_rights_total_count,
        management_company_display_name,
        default_chairperson_name
      `)
      .eq('id', propertyId)
      .eq('company_id', companyId)
      .maybeSingle()

    if (!property) {
      return NextResponse.json({ error: '物件が見つかりません。' }, { status: 404 })
    }

    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    // 並列フェッチ
    const [cardRes, casesRes, tasksRes, complaintsRes, minutesRes] = await Promise.all([
      // property_cards カラムは handover-ai/page.tsx の SELECT で確認済み
      supabase
        .from('property_cards')
        .select(
          'management_memo, board_memo, resident_memo, caution_note, special_rule, annual_schedule_memo, chairman_memo, officers_memo, contact_memo, past_trouble_summary, pinned_note',
        )
        .eq('property_id', propertyId)
        .maybeSingle<PropertyCardRow>(),
      // cases: summary API で確認済みのカラム + handover-ai 確認の assignee, board_next_action
      supabase
        .from('cases')
        .select('id, title, status, created_at, updated_at, overview, assignee, board_next_action')
        .eq('property_id', propertyId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(40),
      supabase
        .from('tasks')
        .select('id, title, status, priority, due_date, created_at')
        .eq('property_id', propertyId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('complaints')
        .select('id, title, status, category, detail, created_at')
        .eq('property_id', propertyId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(20),
      // ai_minutes_records: minutes カラムは records/route.ts で確認済み
      supabase
        .from('ai_minutes_records')
        .select('id, title, official_title, meeting_type, held_on, created_at, status, minutes')
        .eq('property_id', propertyId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    // 案件IDを使ってログを追加取得
    const cases = (casesRes.data ?? []) as Array<{
      id: string
      title: string | null
      status: string | null
      created_at: string | null
      updated_at: string | null
      overview: string | null
      assignee: string | null
      board_next_action: string | null
    }>
    const caseIds = cases.map((c) => c.id).filter(Boolean)
    let logs: Array<{
      id: string
      case_id: string | null
      message: string | null
      created_at: string | null
      type: string | null
    }> = []

    if (caseIds.length > 0) {
      const { data: logData } = await supabase
        .from('logs')
        .select('id, case_id, message, created_at, type')
        .in('case_id', caseIds)
        .order('created_at', { ascending: false })
        .limit(50)
      logs = logData ?? []
    }

    // コンテキストテキストの組み立て
    const lines: string[] = []

    lines.push('【物件情報】')
    lines.push(`物件名: ${safeText(property.name) || '不明'}`)
    if (property.address) lines.push(`所在地: ${property.address}`)
    if (property.management_company_display_name)
      lines.push(`管理会社表示: ${property.management_company_display_name}`)
    if (property.default_chairperson_name)
      lines.push(`理事長: ${property.default_chairperson_name}`)
    if (property.bylaws_article) lines.push(`規約根拠条文: 第${property.bylaws_article}条`)
    if (property.owners_total_count) lines.push(`組合員総数: ${property.owners_total_count}人`)
    if (property.voting_rights_total_count)
      lines.push(`議決権総数: ${property.voting_rights_total_count}個`)
    lines.push(`基準日: ${today.toISOString().split('T')[0]}`)
    lines.push('')

    // 物件カルテ（確認済みカラムのみ使用）
    const card = cardRes.data as PropertyCardRow | null
    if (card) {
      const karteLines: string[] = []
      if (card.pinned_note) karteLines.push(`★ ピン留め: ${card.pinned_note}`)
      if (card.caution_note) karteLines.push(`注意事項: ${card.caution_note}`)
      if (card.special_rule) karteLines.push(`特殊ルール: ${card.special_rule}`)
      if (card.past_trouble_summary) karteLines.push(`過去トラブル: ${card.past_trouble_summary}`)
      if (card.contact_memo) karteLines.push(`連絡メモ: ${card.contact_memo}`)
      if (card.management_memo) karteLines.push(`管理メモ: ${card.management_memo}`)
      if (card.board_memo) karteLines.push(`理事会メモ: ${card.board_memo}`)
      if (card.chairman_memo) karteLines.push(`理事長メモ: ${card.chairman_memo}`)
      if (card.officers_memo) karteLines.push(`役員メモ: ${card.officers_memo}`)
      if (card.resident_memo) karteLines.push(`居住者対応メモ: ${card.resident_memo}`)
      if (card.annual_schedule_memo) karteLines.push(`年間スケジュール: ${card.annual_schedule_memo}`)
      if (karteLines.length > 0) {
        lines.push('【物件カルテ（担当者メモ）】')
        karteLines.forEach((l) => lines.push(l))
        lines.push('')
      }
    }

    // 案件
    if (cases.length > 0) {
      lines.push('【案件一覧】')
      for (const c of cases) {
        const done = ['done', 'closed', '完了'].includes(String(c.status ?? ''))
        const stagnant =
          !done && !!c.updated_at && new Date(c.updated_at) < thirtyDaysAgo
        const tag = stagnant ? '【30日停滞】' : ''
        const overview = c.overview ? ` ／ ${String(c.overview).slice(0, 80)}` : ''
        const nextAction = c.board_next_action
          ? ` ／ 次アクション: ${String(c.board_next_action).slice(0, 60)}`
          : ''
        const assignee = c.assignee ? ` ／ 担当: ${c.assignee}` : ''
        lines.push(
          `- [${c.status ?? '不明'}]${tag} 「${c.title ?? '（無題）'}」（作成: ${toDateStr(c.created_at)}）${overview}${nextAction}${assignee}`,
        )
      }
      lines.push('')
    }

    // 案件ログ（最新30件）
    if (logs.length > 0) {
      lines.push('【案件ログ（対応履歴）】')
      for (const log of logs.slice(0, 30)) {
        const msg = String(log.message ?? '').slice(0, 100)
        if (!msg) continue
        lines.push(`- ${toDateStr(log.created_at)} ${msg}`)
      }
      lines.push('')
    }

    // タスク
    const tasks = (tasksRes.data ?? []) as Array<{
      id: string
      title: string | null
      status: string | null
      priority: string | null
      due_date: string | null
      created_at: string | null
    }>
    if (tasks.length > 0) {
      lines.push('【タスク一覧】')
      for (const t of tasks) {
        const done = t.status === 'done'
        const overdue = !done && !!t.due_date && new Date(t.due_date) < today
        const tag = overdue ? '【期限切れ】' : done ? '' : '【未完了】'
        const due = t.due_date ? `（期限: ${t.due_date}）` : ''
        lines.push(
          `- [${t.status ?? '不明'}]${tag} 「${t.title ?? '（無題）'}」${due}`,
        )
      }
      lines.push('')
    }

    // クレーム
    const complaints = (complaintsRes.data ?? []) as Array<{
      id: string
      title: string | null
      status: string | null
      category: string | null
      detail: string | null
      created_at: string | null
    }>
    if (complaints.length > 0) {
      lines.push('【クレーム一覧】')
      for (const c of complaints) {
        const resolved = c.status === '解決' || c.status === '完了'
        const tag = resolved ? '' : '【未解決】'
        const cat = c.category ? `（${c.category}）` : ''
        const detail = c.detail ? ` ／ ${String(c.detail).slice(0, 60)}` : ''
        lines.push(
          `- [${c.status ?? '不明'}]${tag}${cat} 「${c.title ?? '（件名なし）'}」（受付: ${toDateStr(c.created_at)}）${detail}`,
        )
      }
      lines.push('')
    }

    // 議事録（minutes カラムは records/route.ts で確認済み）
    const minutesList = (minutesRes.data ?? []) as Array<{
      id: string
      title: string | null
      official_title: string | null
      meeting_type: string | null
      held_on: string | null
      created_at: string | null
      status: string | null
      minutes: string | null
    }>
    if (minutesList.length > 0) {
      lines.push('【保存済みAI議事録】')
      for (const m of minutesList) {
        const mt = getMeetingTypeLabel(m.meeting_type)
        const date = m.held_on ?? toDateStr(m.created_at)
        const titleStr = m.official_title ?? m.title ?? '（無題）'
        const snippet = m.minutes
          ? ` ／ 本文抜粋: ${String(m.minutes).slice(0, 100)}`
          : ''
        lines.push(`- ${mt} ${date} 「${titleStr}」${snippet}`)
      }
      lines.push('')
    }

    const contextText = lines.join('\n')

    // プロンプト
    const systemPrompt = `あなたは分譲マンション管理会社のフロント担当者支援AIです。

【出力形式のルール】
- Markdown記法は使わない
- 「**」は使わない
- 「##」や「###」は使わない
- 「-」で始まる箇条書きは使わない
- 箇条書きが必要な場合は「・」を使う
- 見出しは普通の日本語だけにする
- 回答は画面にそのまま表示される前提で書く

【回答内容のルール】
- 提供された物件記録をもとに回答する
- 記録にないことは断定しない
- 不明なことは「記録上では確認できません」と書く
- 推測の場合は「可能性があります」「と考えられます」と書く
- 案件名・タスク名・議事録タイトルがあれば「〇〇案件」などと引用する
- フロント担当者が次に確認すべきことを具体的に書く
- 読みやすい日本語にする
- 300〜600字程度を目安にする
- 長くなりすぎない
- 質問に直接関係しない情報は省略する

物件記録:
${contextText}`

    const answer = await generateOpenAIText({
      systemPrompt,
      userPrompt: question,
    })

    return NextResponse.json({ answer })
  } catch (error) {
    console.error('[memory]', error)
    return NextResponse.json(
      { error: '回答の生成中にエラーが発生しました。' },
      { status: 500 },
    )
  }
}
