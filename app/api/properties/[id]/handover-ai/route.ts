import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

type CaseRow = {
  id: string; title: string | null; status: string | null; assignee: string | null
  created_at: string | null; board_status: string | null; board_agenda_title: string | null
  board_next_action: string | null
}
type TaskRow = {
  id: string; title: string | null; status: string | null
  due_date: string | null; priority: string | null; case_id: string | null
}
type ComplaintRow = {
  id: string; title: string | null; detail: string | null
  status: string | null; created_at: string | null
}
type LogRow = { id: string; case_id: string; message: string | null; created_at: string | null; type: string | null }

function fmt(value: string | null | undefined) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

function trim(v: string | null | undefined, n = 120) {
  const s = (v || '').replace(/\s+/g, ' ').trim()
  return s.length > n ? `${s.slice(0, n)}…` : s
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: propertyId } = await context.params
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY が未設定です。' }, { status: 500 })

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'ログインが必要です。' }, { status: 401 })

    const companyId = await getUserCompanyId()
    if (!companyId) return NextResponse.json({ error: '会社情報が取得できません。' }, { status: 403 })

    // 物件基本 + 新フィールド + カルテを同時取得
    const [
      { data: property },
      { data: card },
      { data: cases },
      { data: tasks },
      { data: complaints },
    ] = await Promise.all([
      supabase.from('properties')
        .select('id, name, address, built_year, structure, total_units, total_floors, association_name, president_name, president_phone, management_fee, repair_reserve, reserve_balance, repair_plan_year, contract_renewal, cleaning_company, elevator_company, insurance_company')
        .eq('id', propertyId).eq('company_id', companyId).maybeSingle(),
      supabase.from('property_cards')
        .select('management_memo, board_memo, caution_notes, officer_memo, pinned_note')
        .eq('property_id', propertyId).maybeSingle(),
      supabase.from('cases')
        .select('id, title, status, assignee, created_at, board_status, board_agenda_title, board_next_action')
        .eq('property_id', propertyId).eq('company_id', companyId)
        .order('created_at', { ascending: false }).limit(20),
      supabase.from('tasks')
        .select('id, title, status, due_date, priority, case_id')
        .eq('property_id', propertyId).eq('company_id', companyId)
        .neq('status', '完了').order('due_date', { ascending: true }).limit(20),
      supabase.from('complaints')
        .select('id, title, detail, status, created_at')
        .eq('property_id', propertyId).eq('company_id', companyId)
        .order('created_at', { ascending: false }).limit(10),
    ])

    if (!property) return NextResponse.json({ error: '物件が見つかりません。' }, { status: 404 })

    const caseIds = (cases ?? []).map((c) => c.id).filter(Boolean)
    let logs: LogRow[] = []
    if (caseIds.length > 0) {
      const { data: logData } = await supabase.from('logs')
        .select('id, case_id, message, created_at, type')
        .in('case_id', caseIds).order('created_at', { ascending: false }).limit(30)
      logs = (logData ?? []) as LogRow[]
    }

    const activeCases = ((cases ?? []) as CaseRow[]).filter((c) => c.status !== '完了')
    const safeTasks = (tasks ?? []) as TaskRow[]
    const safeComplaints = (complaints ?? []) as ComplaintRow[]

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const overdueTasks = safeTasks.filter((t) => {
      if (!t.due_date) return false
      const d = new Date(t.due_date)
      d.setHours(0, 0, 0, 0)
      return d < today
    })

    const contextText = `
【物件】${property.name ?? '未設定'} / ${property.address ?? '未設定'}
築年: ${property.built_year ? `${new Date().getFullYear() - property.built_year}年（${property.built_year}年竣工）` : '不明'} / 構造: ${property.structure ?? '不明'} / ${property.total_units ?? '?'}戸 ${property.total_floors ?? '?'}階建
管理組合: ${property.association_name ?? '未設定'} / 理事長: ${property.president_name ?? '未設定'}（${property.president_phone ?? '電話未設定'}）
管理費: ${property.management_fee ? `${property.management_fee.toLocaleString()}円/月/戸` : '未設定'} / 修繕積立金: ${property.repair_reserve ? `${property.repair_reserve.toLocaleString()}円/月/戸` : '未設定'} / 積立金残高: ${property.reserve_balance ? `${Math.round(property.reserve_balance / 10000)}万円` : '未設定'}
契約更新: ${fmt(property.contract_renewal)} / 清掃: ${property.cleaning_company ?? '未設定'} / EV保守: ${property.elevator_company ?? '未設定'}

【物件カルテ】
ピン留め: ${card?.pinned_note ?? '特記なし'}
注意事項: ${card?.caution_notes ?? '特記なし'}
管理メモ: ${trim(card?.management_memo, 200) ?? '特記なし'}
理事会メモ: ${trim(card?.board_memo, 200) ?? '特記なし'}
理事長対応: ${trim(card?.officer_memo, 200) ?? '特記なし'}

【継続案件 ${activeCases.length}件】
${activeCases.slice(0, 10).map((c) => `・${c.title ?? '無題'} / 状況:${c.status ?? '-'} / 担当:${c.assignee ?? '-'} / 次アクション:${trim(c.board_next_action, 80) || '-'}`).join('\n') || '・なし'}

【未完了タスク ${safeTasks.length}件（うち期限超過${overdueTasks.length}件）】
${safeTasks.slice(0, 15).map((t) => `・${t.title ?? '無題'} / 優先度:${t.priority ?? '-'} / 期限:${fmt(t.due_date)}`).join('\n') || '・なし'}

【クレーム ${safeComplaints.length}件】
${safeComplaints.slice(0, 8).map((c) => `・${c.title ?? '無題'} / 状況:${c.status ?? '-'} / ${fmt(c.created_at)} / ${trim(c.detail, 100) || '詳細なし'}`).join('\n') || '・なし'}

【最近のログ】
${logs.slice(0, 15).map((l) => `・${fmt(l.created_at)} [${l.type ?? '-'}] ${trim(l.message, 100)}`).join('\n') || '・なし'}
`.trim()

    const systemPrompt = `あなたはマンション管理会社のベテランフロント担当者です。
後任担当者が朝イチで読んで即動けるように、引き継ぎ書の3セクションを生成してください。
出力は必ずJSONで返してください。他のテキストは一切不要です。
形式: {"進行中案件":"...","未完了タスク":"...","クレーム継続事項":"..."}
各セクションは「・」始まりの箇条書き。優先度の高いものを先に。事実のみ記載。英語カラム名禁止。`

    const userPrompt = `以下のデータをもとに3セクションを生成してください。\n\n${contextText}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-5.4-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_completion_tokens: 1600,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      })

      const json = await res.json()
      if (!res.ok) return NextResponse.json({ error: json?.error?.message ?? 'AI生成に失敗しました。' }, { status: 500 })

      const raw = json?.choices?.[0]?.message?.content ?? ''
      let sections: Record<string, string> = {}
      try { sections = JSON.parse(raw) } catch { sections = {} }

      return NextResponse.json({
        進行中案件: sections['進行中案件'] ?? '',
        未完了タスク: sections['未完了タスク'] ?? '',
        クレーム継続事項: sections['クレーム継続事項'] ?? '',
      })
    } finally {
      clearTimeout(timeout)
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '不明なエラー' }, { status: 500 })
  }
}
