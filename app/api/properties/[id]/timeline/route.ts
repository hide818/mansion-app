import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type RouteContext = {
  params: Promise<{ id: string }>
}

type CaseRow = {
  id: string
  title: string | null
  status: string | null
  created_at: string | null
  updated_at: string | null
  overview: string | null
  description: string | null
  content: string | null
}

type LogRow = {
  id: string
  case_id: string | null
  message: string | null
  created_at: string | null
  type: string | null
}

type TaskRow = {
  id: string
  title: string | null
  status: string | null
  priority: string | null
  due_date: string | null
  created_at: string | null
}

type ComplaintRow = {
  id: string
  title: string | null
  status: string | null
  category: string | null
  detail: string | null
  created_at: string | null
}

type MinutesRow = {
  id: string
  title: string | null
  official_title: string | null
  meeting_type: string | null
  held_on: string | null
  created_at: string | null
  status: string | null
}

export type TimelineEntry = {
  id: string
  type: 'case' | 'log' | 'task' | 'complaint' | 'minutes'
  typeLabel: string
  title: string
  description: string
  sortDate: string
  href: string
  status: string
  isOverdue: boolean
  isIncomplete: boolean
  isStagnant: boolean
}

const DONE_STATUSES = new Set(['done', 'closed', '完了', 'completed'])

function isCaseDone(status: string | null): boolean {
  return DONE_STATUSES.has(status ?? '')
}

function truncate(text: string | null | undefined, len = 80): string {
  if (!text) return ''
  const trimmed = text.trim()
  return trimmed.length > len ? `${trimmed.slice(0, len)}…` : trimmed
}

function getMeetingTypeLabel(type: string | null): string {
  if (type === 'board_meeting') return '理事会'
  if (type === 'general_meeting') return '総会'
  return type ?? '会議'
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id: propertyId } = await context.params
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    const { data: property } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .eq('company_id', companyId)
      .maybeSingle()

    if (!property) {
      return NextResponse.json({ error: '物件が見つかりません。' }, { status: 404 })
    }

    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const entries: TimelineEntry[] = []

    // 1. Cases
    const { data: casesData } = await supabase
      .from('cases')
      .select('id, title, status, created_at, updated_at, overview, description, content')
      .eq('property_id', propertyId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(100)

    const cases = (casesData ?? []) as CaseRow[]
    const caseMap = new Map<string, CaseRow>()

    for (const c of cases) {
      caseMap.set(c.id, c)
      const done = isCaseDone(c.status)
      const stagnant =
        !done && !!c.updated_at && new Date(c.updated_at) < thirtyDaysAgo

      entries.push({
        id: c.id,
        type: 'case',
        typeLabel: '案件',
        title: c.title ?? '（タイトルなし）',
        description: truncate(c.overview ?? c.description ?? c.content),
        sortDate: c.created_at ?? '',
        href: `/properties/${propertyId}/cases/${c.id}`,
        status: c.status ?? '',
        isOverdue: false,
        isIncomplete: !done,
        isStagnant: stagnant,
      })
    }

    // 2. Logs (case_id で cases に紐づく)
    const caseIds = cases.map((c) => c.id)
    if (caseIds.length > 0) {
      const { data: logsData } = await supabase
        .from('logs')
        .select('id, case_id, message, created_at, type')
        .in('case_id', caseIds)
        .order('created_at', { ascending: false })
        .limit(200)

      for (const log of (logsData ?? []) as LogRow[]) {
        const parent = log.case_id ? caseMap.get(log.case_id) : null
        entries.push({
          id: log.id,
          type: 'log',
          typeLabel: 'ログ',
          title: parent?.title ? `${parent.title} ／ ログ` : 'ログ',
          description: truncate(log.message),
          sortDate: log.created_at ?? '',
          href: log.case_id
            ? `/properties/${propertyId}/cases/${log.case_id}`
            : `/properties/${propertyId}/cases`,
          status: log.type ?? '',
          isOverdue: false,
          isIncomplete: false,
          isStagnant: false,
        })
      }
    }

    // 3. Tasks
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('id, title, status, priority, due_date, created_at')
      .eq('property_id', propertyId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(100)

    for (const task of (tasksData ?? []) as TaskRow[]) {
      const done = task.status === 'done'
      const overdue = !done && !!task.due_date && new Date(task.due_date) < today
      const duePart = task.due_date ? `期限: ${task.due_date}` : ''
      const priPart = task.priority ? `優先度: ${task.priority}` : ''
      entries.push({
        id: task.id,
        type: 'task',
        typeLabel: 'タスク',
        title: task.title ?? '（タスク名なし）',
        description: [priPart, duePart].filter(Boolean).join(' ／ '),
        sortDate: task.created_at ?? '',
        href: `/properties/${propertyId}/tasks`,
        status: task.status ?? '',
        isOverdue: overdue,
        isIncomplete: !done,
        isStagnant: false,
      })
    }

    // 4. Complaints
    const { data: complaintsData } = await supabase
      .from('complaints')
      .select('id, title, status, category, detail, created_at')
      .eq('property_id', propertyId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(100)

    for (const c of (complaintsData ?? []) as ComplaintRow[]) {
      const resolved = c.status === '解決' || c.status === '完了'
      entries.push({
        id: c.id,
        type: 'complaint',
        typeLabel: 'クレーム',
        title: c.title ?? '（件名なし）',
        description: truncate(c.detail ?? c.category),
        sortDate: c.created_at ?? '',
        href: `/properties/${propertyId}/complaints-history`,
        status: c.status ?? '',
        isOverdue: false,
        isIncomplete: !resolved,
        isStagnant: false,
      })
    }

    // 5. AI Minutes
    const { data: minutesData } = await supabase
      .from('ai_minutes_records')
      .select('id, title, official_title, meeting_type, held_on, created_at, status')
      .eq('property_id', propertyId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50)

    for (const m of (minutesData ?? []) as MinutesRow[]) {
      const typeLabel = getMeetingTypeLabel(m.meeting_type)
      entries.push({
        id: m.id,
        type: 'minutes',
        typeLabel: '議事録',
        title: m.official_title ?? m.title ?? '（議事録名なし）',
        description: `${typeLabel}${m.held_on ? ` ／ 開催日: ${m.held_on}` : ''}`,
        sortDate: m.held_on ?? m.created_at ?? '',
        href: `/ai-minutes/records/${m.id}`,
        status: m.status ?? '',
        isOverdue: false,
        isIncomplete: false,
        isStagnant: false,
      })
    }

    // Sort: newest first, entries without date go last
    entries.sort((a, b) => {
      if (!a.sortDate && !b.sortDate) return 0
      if (!a.sortDate) return 1
      if (!b.sortDate) return -1
      return new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime()
    })

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('[timeline]', error)
    return NextResponse.json(
      { error: 'タイムラインの取得中にエラーが発生しました。' },
      { status: 500 },
    )
  }
}
