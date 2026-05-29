import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type CaseRow = {
  id: string
  title: string | null
  property_id: string | null
  status: string | null
  assignee: string | null
  board_status: string | null
  board_scheduled_for: string | null
  board_next_action: string | null
  created_at: string | null
}

type TaskRow = {
  id: string
  case_id: string | null
  title: string | null
  status: string | null
  due_date: string | null
  priority: string | null
}

type LogRow = {
  case_id: string | null
  created_at: string | null
}

type PropertyRow = {
  id: string
  name: string | null
}

function formatDate(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function diffDaysFromToday(value: string | null) {
  if (!value) return null

  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return null

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate())

  return Math.floor((todayStart.getTime() - targetStart.getTime()) / (1000 * 60 * 60 * 24))
}

function getPriorityScore(priority: string | null) {
  if (priority === '高') return 3
  if (priority === '中') return 2
  if (priority === '低') return 1
  return 0
}

export default async function NextActionsPage() {
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
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          所属会社が設定されていません。profiles.company_id を確認してください。
        </div>
      </div>
    )
  }

  const [{ data: cases, error: casesError }, { data: tasks, error: tasksError }, { data: logs, error: logsError }] =
    await Promise.all([
      supabase
        .from('cases')
        .select(
          'id, title, property_id, status, assignee, board_status, board_scheduled_for, board_next_action, created_at'
        )
        .eq('company_id', companyId)
        .neq('status', '完了')
        .order('created_at', { ascending: true }),
      supabase
        .from('tasks')
        .select('id, case_id, title, status, due_date, priority')
        .eq('company_id', companyId),
      supabase
        .from('logs')
        .select('case_id, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false }),
    ])

  if (casesError || tasksError || logsError) {
    console.error('next actions page error:', { casesError, tasksError, logsError })

    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          次にやることの取得に失敗しました。cases / tasks / logs テーブルを確認してください。
        </div>
      </div>
    )
  }

  const safeCases = (cases ?? []) as CaseRow[]
  const safeTasks = (tasks ?? []) as TaskRow[]
  const safeLogs = (logs ?? []) as LogRow[]

  const propertyIds = Array.from(new Set(safeCases.map((item) => item.property_id).filter(Boolean))) as string[]

  const { data: properties } =
    propertyIds.length > 0
      ? await supabase.from('properties').select('id, name').in('id', propertyIds)
      : { data: [] as PropertyRow[] }

  const propertyMap = new Map<string, string>()
  ;((properties ?? []) as PropertyRow[]).forEach((item) => {
    propertyMap.set(item.id, item.name ?? '物件名未設定')
  })

  const caseTaskMap = new Map<string, TaskRow[]>()
  safeTasks.forEach((task) => {
    if (!task.case_id) return
    if (!caseTaskMap.has(task.case_id)) {
      caseTaskMap.set(task.case_id, [])
    }
    caseTaskMap.get(task.case_id)!.push(task)
  })

  const latestLogMap = new Map<string, string>()
  safeLogs.forEach((log) => {
    if (!log.case_id || !log.created_at) return
    if (!latestLogMap.has(log.case_id)) {
      latestLogMap.set(log.case_id, log.created_at)
    }
  })

  const today = new Date()
  const todayText = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const rows = safeCases.map((item) => {
    const relatedTasks = caseTaskMap.get(item.id) ?? []
    const openTasks = relatedTasks.filter((task) => task.status !== '完了')
    const overdueTasks = openTasks.filter((task) => task.due_date && task.due_date < todayText)
    const nextTask = openTasks
      .slice()
      .sort((a, b) => {
        const dueCompare = (a.due_date ?? '9999-12-31').localeCompare(b.due_date ?? '9999-12-31')
        if (dueCompare !== 0) return dueCompare
        return getPriorityScore(b.priority) - getPriorityScore(a.priority)
      })[0]

    const lastLogAt = latestLogMap.get(item.id) ?? item.created_at
    const staleDays = diffDaysFromToday(lastLogAt)

    let nextAction = '案件内容を確認して次の対応を整理'
    let reason = '基本アクション'

    if (!item.assignee) {
      nextAction = '担当者を設定する'
      reason = '担当未設定'
    } else if (overdueTasks.length > 0) {
      nextAction = `期限切れタスク「${overdueTasks[0].title || '無題タスク'}」を優先対応`
      reason = '期限切れタスクあり'
    } else if (nextTask) {
      nextAction = `タスク「${nextTask.title || '無題タスク'}」を進める`
      reason = '未完了タスクあり'
    } else if (item.board_status === '上程予定' && !item.board_next_action) {
      nextAction = '理事会上程に向けた次アクションを入力する'
      reason = '理事会アクション未設定'
    } else if ((staleDays ?? 0) >= 14) {
      nextAction = '進捗確認の連絡または現地確認を行う'
      reason = '更新停滞'
    } else if (item.board_next_action) {
      nextAction = item.board_next_action
      reason = '案件に登録済みの次アクション'
    }

    return {
      ...item,
      nextAction,
      reason,
      nextTaskDueDate: nextTask?.due_date ?? null,
    }
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">次にやること自動表示</h1>
        <p className="mt-2 text-sm text-gray-600">
          案件状況、タスク期限、担当者有無、理事会情報を元に、次にやるべきことを自動提案しています。
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">対象案件数</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{rows.length}</div>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <div className="text-sm text-blue-700">使い方</div>
          <div className="mt-2 text-sm font-medium text-blue-900">
            朝の確認や引き継ぎ時の初動確認に使えます
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">並び</div>
          <div className="mt-2 text-sm font-medium text-gray-900">案件ごとに1つ提案</div>
        </div>
      </div>

      <div className="grid gap-4">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
            表示できる案件はありません。
          </div>
        ) : (
          rows.map((item) => (
            <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-lg font-semibold text-gray-900">{item.title || '無題案件'}</div>
                  <div className="mt-1 text-sm text-gray-600">
                    物件: {item.property_id ? propertyMap.get(item.property_id) ?? '-' : '-'} / 担当者:{' '}
                    {item.assignee || '未設定'}
                  </div>
                </div>

                <div>
                  {item.property_id ? (
                    <Link
                      href={`/properties/${item.property_id}/cases/${item.id}`}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                    >
                      案件詳細へ
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="text-sm text-blue-700">次にやること</div>
                <div className="mt-2 text-base font-semibold text-blue-900">{item.nextAction}</div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">提案理由</div>
                  <div className="mt-1 text-sm text-gray-900">{item.reason}</div>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">案件ステータス</div>
                  <div className="mt-1 text-sm text-gray-900">{item.status || '-'}</div>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">次の期限目安</div>
                  <div className="mt-1 text-sm text-gray-900">{formatDate(item.nextTaskDueDate)}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}