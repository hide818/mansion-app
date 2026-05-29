import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type PropertyRow = {
  id: string
  name: string | null
  address: string | null
}

type CaseRow = {
  id: string
  title: string | null
  status: string | null
  assignee: string | null
  board_status: string | null
  board_scheduled_for: string | null
  created_at: string | null
}

type TaskRow = {
  id: string
  title: string | null
  status: string | null
  due_date: string | null
  priority: string | null
  case_id: string | null
  created_at: string | null
}

type ComplaintRow = {
  id: string
  title: string | null
  detail: string | null
  status: string | null
  created_at: string | null
}

type LogRow = {
  id: string
  case_id: string | null
  message: string | null
  created_at: string | null
  type: string | null
}

export type PropertySupportData = {
  companyId: string
  property: PropertyRow
  counts: {
    totalCases: number
    openCases: number
    openTasks: number
    complaintCount: number
  }
  cases: CaseRow[]
  tasks: TaskRow[]
  complaints: ComplaintRow[]
  logs: LogRow[]
}

function formatDate(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export async function getPropertySupportData(
  propertyId: string
): Promise<PropertySupportData | null> {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  if (!companyId) return null

  const { data: property } = await supabase
    .from('properties')
    .select('id, name, address')
    .eq('id', propertyId)
    .eq('company_id', companyId)
    .maybeSingle<PropertyRow>()

  if (!property) return null

  const [
    casesResult,
    tasksResult,
    complaintsResult,
    totalCasesCountResult,
    openCasesCountResult,
    openTasksCountResult,
    complaintCountResult,
  ] = await Promise.all([
    supabase
      .from('cases')
      .select(
        'id, title, status, assignee, board_status, board_scheduled_for, created_at'
      )
      .eq('property_id', propertyId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('tasks')
      .select('id, title, status, due_date, priority, case_id, created_at')
      .eq('property_id', propertyId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('complaints')
      .select('id, title, detail, status, created_at')
      .eq('property_id', propertyId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', propertyId)
      .eq('company_id', companyId),
    supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', propertyId)
      .eq('company_id', companyId)
      .neq('status', '完了'),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', propertyId)
      .eq('company_id', companyId)
      .neq('status', '完了'),
    supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', propertyId)
      .eq('company_id', companyId),
  ])

  const cases = (casesResult.data ?? []) as CaseRow[]
  const tasks = (tasksResult.data ?? []) as TaskRow[]
  const complaints = (complaintsResult.data ?? []) as ComplaintRow[]

  const caseIds = cases.map((item) => item.id).filter(Boolean)

  let logs: LogRow[] = []

  if (caseIds.length > 0) {
    const { data: logRows } = await supabase
      .from('logs')
      .select('id, case_id, message, created_at, type')
      .eq('company_id', companyId)
      .in('case_id', caseIds)
      .order('created_at', { ascending: false })
      .limit(20)

    logs = (logRows ?? []) as LogRow[]
  }

  return {
    companyId,
    property,
    counts: {
      totalCases: totalCasesCountResult.count ?? 0,
      openCases: openCasesCountResult.count ?? 0,
      openTasks: openTasksCountResult.count ?? 0,
      complaintCount: complaintCountResult.count ?? 0,
    },
    cases,
    tasks,
    complaints,
    logs,
  }
}

export function buildPropertySnapshotText(data: PropertySupportData) {
  const caseLines =
    data.cases.length === 0
      ? ['・案件なし']
      : data.cases.slice(0, 8).map((item) => {
          const board =
            item.board_status || item.board_scheduled_for
              ? ` / 理事会:${item.board_status ?? '-'} / 上程:${formatDate(item.board_scheduled_for)}`
              : ''

          return `・${item.title ?? '無題案件'} / 状況:${item.status ?? '-'} / 担当:${item.assignee ?? '-'}${board}`
        })

  const taskLines =
    data.tasks.length === 0
      ? ['・タスクなし']
      : data.tasks.slice(0, 8).map((item) => {
          return `・${item.title ?? '無題タスク'} / 状況:${item.status ?? '-'} / 期限:${formatDate(item.due_date)} / 優先度:${item.priority ?? '-'}`
        })

  const complaintLines =
    data.complaints.length === 0
      ? ['・クレームなし']
      : data.complaints.slice(0, 5).map((item) => {
          const detail = (item.detail ?? '').replace(/\s+/g, ' ').trim()
          const shortDetail =
            detail.length > 80 ? `${detail.slice(0, 80)}…` : detail || '-'

          return `・${item.title ?? '無題クレーム'} / 状況:${item.status ?? '-'} / 内容:${shortDetail}`
        })

  const logLines =
    data.logs.length === 0
      ? ['・ログなし']
      : data.logs.slice(0, 8).map((item) => {
          const text = (item.message ?? '').replace(/\s+/g, ' ').trim()
          const shortText = text.length > 80 ? `${text.slice(0, 80)}…` : text || '-'

          return `・${formatDate(item.created_at)} / ${shortText}`
        })

  return [
    `物件名: ${data.property.name ?? '-'}`,
    `住所: ${data.property.address ?? '-'}`,
    '',
    `件数サマリー`,
    `・全案件数: ${data.counts.totalCases}`,
    `・進行中案件数: ${data.counts.openCases}`,
    `・未完了タスク数: ${data.counts.openTasks}`,
    `・クレーム件数: ${data.counts.complaintCount}`,
    '',
    `最近の案件`,
    ...caseLines,
    '',
    `最近のタスク`,
    ...taskLines,
    '',
    `最近のクレーム`,
    ...complaintLines,
    '',
    `最近のログ`,
    ...logLines,
  ].join('\n')
}