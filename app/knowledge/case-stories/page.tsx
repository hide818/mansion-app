import Link from 'next/link'
import { redirect } from 'next/navigation'
import CopyTextButton from '@/app/components/CopyTextButton'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type CaseRow = {
  id: string
  title: string | null
  property_id: string | null
  status: string | null
  assignee: string | null
  created_at: string | null
  board_status: string | null
  board_agenda_title: string | null
  board_next_action: string | null
}

type PropertyRow = {
  id: string
  name: string | null
}

type TaskRow = {
  id: string
  case_id: string | null
  title: string | null
  status: string | null
  due_date: string | null
  priority: string | null
  created_at: string | null
}

type LogRow = {
  id: string
  case_id: string | null
  message: string | null
  created_at: string | null
  type: string | null
}

function formatDateTime(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function buildStory(params: {
  propertyName: string
  item: CaseRow
  logs: LogRow[]
  tasks: TaskRow[]
}) {
  const { propertyName, item, logs, tasks } = params

  const lines: string[] = []

  lines.push(`【物件】${propertyName}`)
  lines.push(`【案件名】${item.title ?? '案件名未設定'}`)
  lines.push(`【現在の状態】${item.status ?? '未設定'}`)
  lines.push(`【担当者】${item.assignee ?? '未設定'}`)
  lines.push(`【開始日】${formatDateTime(item.created_at)}`)
  lines.push('')

  lines.push('■時系列ストーリー')
  lines.push(`・案件が作成された日: ${formatDateTime(item.created_at)}`)

  for (const log of logs.slice(0, 5)) {
    lines.push(`・${formatDateTime(log.created_at)}: ${log.message ?? 'ログ本文なし'}`)
  }

  if (tasks.length > 0) {
    lines.push('')
    lines.push('■タスク状況')
    for (const task of tasks.slice(0, 5)) {
      lines.push(
        `・${task.title ?? 'タスク名未設定'} / 状態:${task.status ?? '-'} / 期限:${task.due_date ?? '-'} / 優先度:${task.priority ?? '-'}`
      )
    }
  }

  lines.push('')
  lines.push('■理事会関連')
  lines.push(`・理事会ステータス: ${item.board_status ?? '未設定'}`)
  lines.push(`・議案タイトル: ${item.board_agenda_title ?? '未設定'}`)
  lines.push(`・次アクション: ${item.board_next_action ?? '未設定'}`)

  return lines.join('\n')
}

export default async function CaseStoriesPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const companyId = await getUserCompanyId()

  if (!companyId) {
    return (
      <div className="p-6">
        <h1 className="mb-4 text-2xl font-bold">案件履歴ストーリー</h1>
        <p className="text-sm text-red-600">company_id が取得できませんでした。</p>
      </div>
    )
  }

  const { data: cases, error: casesError } = await supabase
    .from('cases')
    .select(
      'id, title, property_id, status, assignee, created_at, board_status, board_agenda_title, board_next_action'
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (casesError) {
    return (
      <div className="p-6">
        <h1 className="mb-4 text-2xl font-bold">案件履歴ストーリー</h1>
        <p className="text-sm text-red-600">{casesError.message}</p>
      </div>
    )
  }

  const caseIds = (cases ?? []).map((item) => item.id)
  const propertyIds = Array.from(
    new Set((cases ?? []).map((item) => item.property_id).filter(Boolean))
  ) as string[]

  const { data: properties } = propertyIds.length
    ? await supabase
        .from('properties')
        .select('id, name')
        .eq('company_id', companyId)
        .in('id', propertyIds)
    : { data: [] as PropertyRow[] }

  const { data: logs } = caseIds.length
    ? await supabase
        .from('logs')
        .select('id, case_id, message, created_at, type')
        .eq('company_id', companyId)
        .in('case_id', caseIds)
        .order('created_at', { ascending: false })
    : { data: [] as LogRow[] }

  const { data: tasks } = caseIds.length
    ? await supabase
        .from('tasks')
        .select('id, case_id, title, status, due_date, priority, created_at')
        .eq('company_id', companyId)
        .in('case_id', caseIds)
        .order('created_at', { ascending: false })
    : { data: [] as TaskRow[] }

  const propertyMap = new Map<string, string>()
  for (const property of properties ?? []) {
    propertyMap.set(property.id, property.name ?? '物件名未設定')
  }

  const logsMap = new Map<string, LogRow[]>()
  for (const log of logs ?? []) {
    if (!log.case_id) continue
    const current = logsMap.get(log.case_id) ?? []
    current.push(log)
    logsMap.set(log.case_id, current)
  }

  const tasksMap = new Map<string, TaskRow[]>()
  for (const task of tasks ?? []) {
    if (!task.case_id) continue
    const current = tasksMap.get(task.case_id) ?? []
    current.push(task)
    tasksMap.set(task.case_id, current)
  }

  const rows = (cases ?? []).map((item) => {
    const propertyName = propertyMap.get(item.property_id ?? '') ?? '物件未設定'
    const storyText = buildStory({
      propertyName,
      item,
      logs: logsMap.get(item.id) ?? [],
      tasks: tasksMap.get(item.id) ?? [],
    })

    return {
      ...item,
      propertyName,
      storyText,
      logs: logsMap.get(item.id) ?? [],
      tasks: tasksMap.get(item.id) ?? [],
    }
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">案件履歴ストーリー</h1>
        <p className="mt-2 text-sm text-gray-600">
          ログとタスクをまとめて、案件の流れを読みやすい文章で見られるページです。
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6">
          <p className="text-sm text-gray-700">表示できる案件がありません。</p>
        </div>
      ) : (
        <div className="space-y-5">
          {rows.map((item) => (
            <div key={item.id} className="rounded-2xl border bg-white p-5">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs text-gray-500">{item.propertyName}</p>
                  <h2 className="text-lg font-bold">{item.title ?? '案件名未設定'}</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    ステータス: {item.status ?? '-'} / 担当者: {item.assignee ?? '-'}
                  </p>
                </div>

                <CopyTextButton text={item.storyText} label="ストーリーをコピー" />
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-800">
                  {item.storyText}
                </pre>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/properties/${item.property_id}/cases/${item.id}`}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
                >
                  案件詳細を見る
                </Link>
                <Link
                  href={`/properties/${item.property_id}/cases/${item.id}/handover-summary`}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  引き継ぎサマリー
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}