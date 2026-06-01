import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export type DashboardAlert = {
  id: string
  type: 'task_overdue' | 'task_today' | 'task_upcoming' | 'case_stalled' | 'complaint_open'
  severity: 'urgent' | 'warning' | 'info'
  propertyId: string | null
  propertyName: string
  title: string
  reason: string
  dateLabel: string
  daysLabel?: string
  href?: string
}

const TASK_DONE = new Set(['done', 'closed', '完了', 'completed'])
const CASE_DONE = new Set(['done', 'closed', '完了', 'completed'])
const COMPLAINT_RESOLVED = new Set(['解決', '完了', '対応完了', 'closed', 'done', 'completed'])

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

function toDateOnly(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    const today = toDateOnly(new Date())
    const sevenDaysLater = new Date(today)
    sevenDaysLater.setDate(today.getDate() + 7)
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    const fourteenDaysAgo = new Date(today)
    fourteenDaysAgo.setDate(today.getDate() - 14)

    const [propRes, taskRes, caseRes, complaintRes] = await Promise.all([
      supabase
        .from('properties')
        .select('id, name')
        .eq('company_id', companyId),
      supabase
        .from('tasks')
        .select('id, title, status, due_date, priority, case_id, property_id')
        .eq('company_id', companyId)
        .not('due_date', 'is', null)
        .limit(200),
      supabase
        .from('cases')
        .select('id, title, status, updated_at, assignee, board_next_action, property_id')
        .eq('company_id', companyId)
        .limit(200),
      supabase
        .from('complaints')
        .select('id, title, status, category, created_at, property_id')
        .eq('company_id', companyId)
        .limit(200),
    ])

    const propMap = new Map<string, string>()
    for (const p of (propRes.data ?? [])) {
      propMap.set(p.id as string, (p.name as string | null) ?? '不明な物件')
    }

    const getPropName = (propertyId: string | null): string => {
      if (!propertyId) return '物件未設定'
      return propMap.get(propertyId) ?? '不明な物件'
    }

    const alerts: DashboardAlert[] = []

    // A/B/C: タスクアラート
    type TaskRow = {
      id: string
      title: string | null
      status: string | null
      due_date: string | null
      priority: string | null
      case_id: string | null
      property_id: string | null
    }

    for (const task of (taskRes.data ?? []) as TaskRow[]) {
      if (TASK_DONE.has(task.status ?? '')) continue
      if (!task.due_date) continue
      const due = toDateOnly(new Date(task.due_date))
      const propertyName = getPropName(task.property_id)
      const href = task.property_id ? `/properties/${task.property_id}/tasks` : undefined

      if (due < today) {
        const days = daysBetween(due, today)
        alerts.push({
          id: `task_overdue_${task.id}`,
          type: 'task_overdue',
          severity: 'urgent',
          propertyId: task.property_id,
          propertyName,
          title: task.title ?? '（無題タスク）',
          reason: `未完了タスクの期限を${days}日超過しています。`,
          dateLabel: `期限: ${task.due_date}`,
          daysLabel: `${days}日超過`,
          href,
        })
      } else if (due.getTime() === today.getTime()) {
        alerts.push({
          id: `task_today_${task.id}`,
          type: 'task_today',
          severity: 'warning',
          propertyId: task.property_id,
          propertyName,
          title: task.title ?? '（無題タスク）',
          reason: '本日が期限です。',
          dateLabel: `期限: ${task.due_date}`,
          href,
        })
      } else if (due <= sevenDaysLater) {
        const days = daysBetween(today, due)
        alerts.push({
          id: `task_upcoming_${task.id}`,
          type: 'task_upcoming',
          severity: 'info',
          propertyId: task.property_id,
          propertyName,
          title: task.title ?? '（無題タスク）',
          reason: `${days}日以内に期限が来ます。`,
          dateLabel: `期限: ${task.due_date}`,
          daysLabel: `あと${days}日`,
          href,
        })
      }
    }

    // D: 案件アラート
    type CaseRow = {
      id: string
      title: string | null
      status: string | null
      updated_at: string | null
      assignee: string | null
      board_next_action: string | null
      property_id: string | null
    }

    for (const c of (caseRes.data ?? []) as CaseRow[]) {
      if (CASE_DONE.has(c.status ?? '')) continue

      const propertyName = getPropName(c.property_id)
      const href = c.property_id ? `/properties/${c.property_id}/cases/${c.id}` : undefined

      if (c.updated_at) {
        const updatedAt = toDateOnly(new Date(c.updated_at))
        if (updatedAt < thirtyDaysAgo) {
          const days = daysBetween(updatedAt, today)
          alerts.push({
            id: `case_stalled_${c.id}`,
            type: 'case_stalled',
            severity: 'urgent',
            propertyId: c.property_id,
            propertyName,
            title: c.title ?? '（無題案件）',
            reason: `${days}日以上更新がありません。`,
            dateLabel: `最終更新: ${c.updated_at.split('T')[0]}`,
            daysLabel: `${days}日停滞`,
            href,
          })
          continue
        }
      }

      if (!c.board_next_action || c.board_next_action.trim() === '') {
        alerts.push({
          id: `case_no_action_${c.id}`,
          type: 'case_stalled',
          severity: 'warning',
          propertyId: c.property_id,
          propertyName,
          title: c.title ?? '（無題案件）',
          reason: '次のアクションが設定されていません。',
          dateLabel: c.updated_at ? `最終更新: ${c.updated_at.split('T')[0]}` : '更新日不明',
          href,
        })
      }
    }

    // E: クレームアラート
    type ComplaintRow = {
      id: string
      title: string | null
      status: string | null
      category: string | null
      created_at: string | null
      property_id: string | null
    }

    for (const c of (complaintRes.data ?? []) as ComplaintRow[]) {
      if (COMPLAINT_RESOLVED.has(c.status ?? '')) continue

      const propertyName = getPropName(c.property_id)
      const href = c.property_id ? `/properties/${c.property_id}/complaints-history` : undefined
      const createdAt = c.created_at ? toDateOnly(new Date(c.created_at)) : null
      const isLongOpen = createdAt ? createdAt < fourteenDaysAgo : false
      const days = createdAt ? daysBetween(createdAt, today) : null

      alerts.push({
        id: `complaint_open_${c.id}`,
        type: 'complaint_open',
        severity: isLongOpen ? 'urgent' : 'warning',
        propertyId: c.property_id,
        propertyName,
        title: c.title ?? '（件名なし）',
        reason: isLongOpen
          ? `${days}日以上未解決のクレームです。`
          : 'クレームが未解決です。',
        dateLabel: c.created_at ? `受付: ${c.created_at.split('T')[0]}` : '受付日不明',
        daysLabel: isLongOpen && days !== null ? `${days}日経過` : undefined,
        href,
      })
    }

    const severityOrder = { urgent: 0, warning: 1, info: 2 }
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error('[dashboard/alerts]', error)
    return NextResponse.json(
      { error: 'アラートの取得に失敗しました。' },
      { status: 500 },
    )
  }
}
