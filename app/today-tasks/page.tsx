import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type TaskRow = {
  id: string
  title: string | null
  status: string | null
  priority: string | null
  due_date: string | null
  property_id: string | null
  case_id: string | null
  created_at: string | null
}

function formatDate(value: string | null) {
  if (!value) return '未設定'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function isToday(value: string | null) {
  if (!value) return false

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  const now = new Date()

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function isOverdue(value: string | null) {
  if (!value) return false

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const due = new Date(date)
  due.setHours(0, 0, 0, 0)

  return due < today
}

function sortTasks(tasks: TaskRow[]) {
  return [...tasks].sort((a, b) => {
    if (!a.due_date && !b.due_date) {
      return (b.created_at ?? '').localeCompare(a.created_at ?? '')
    }

    if (!a.due_date) return 1
    if (!b.due_date) return -1

    return a.due_date.localeCompare(b.due_date)
  })
}

function getStatusLabel(status: string | null) {
  if (!status) return '未設定'

  switch (status) {
    case 'todo':
      return '未着手'
    case 'doing':
      return '進行中'
    case 'done':
      return '完了'
    case 'pending':
      return '保留'
    default:
      return status
  }
}

function getPriorityLabel(priority: string | null) {
  if (!priority) return '未設定'

  switch (priority) {
    case 'high':
      return '高'
    case 'medium':
      return '中'
    case 'low':
      return '低'
    default:
      return priority
  }
}

export default async function TodayTasksPage() {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, status, priority, due_date, property_id, case_id, created_at')
    .eq('company_id', companyId)
    .neq('status', 'done')

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-2xl font-bold text-red-700">今日やること</h1>
          <p className="mt-3 text-sm text-red-600">
            タスクの取得に失敗しました。Supabase の tasks テーブルと company_id の取得状況を確認してください。
          </p>
          <p className="mt-2 text-xs text-red-500">{error.message}</p>
        </div>
      </div>
    )
  }

  const tasks = sortTasks((data ?? []) as TaskRow[])
  const todayTasks = tasks.filter((task) => isToday(task.due_date))
  const overdueTasks = tasks.filter((task) => isOverdue(task.due_date))
  const upcomingTasks = tasks.filter(
    (task) => !isToday(task.due_date) && !isOverdue(task.due_date),
  )

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">案件・タスク管理</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">今日やること</h1>
            <p className="mt-2 text-sm text-slate-600">
              未完了タスクを、期限が近い順に確認できます。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/tasks"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              タスク一覧へ
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              ダッシュボードへ
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">今日期限</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{todayTasks.length}</p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <p className="text-sm text-red-600">期限切れ</p>
          <p className="mt-2 text-3xl font-bold text-red-700">{overdueTasks.length}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">未完了合計</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{tasks.length}</p>
        </div>
      </div>

      <section className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">期限切れ</h2>
            <p className="mt-1 text-sm text-slate-600">
              先に処理したいタスクです。
            </p>
          </div>
          <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
            {overdueTasks.length}件
          </span>
        </div>

        {overdueTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            期限切れタスクはありません。
          </div>
        ) : (
          <div className="space-y-3">
            {overdueTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-red-200 bg-red-50 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-base font-bold text-slate-900">
                      {task.title || '無題タスク'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        状況: {getStatusLabel(task.status)}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        優先度: {getPriorityLabel(task.priority)}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-red-700">
                        期限: {formatDate(task.due_date)}
                      </span>
                    </div>
                  </div>

                  {task.property_id ? (
                    <Link
                      href={`/properties/${task.property_id}/tasks`}
                      className="text-sm font-medium text-emerald-700 hover:underline"
                    >
                      物件タスクを見る
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">今日期限</h2>
            <p className="mt-1 text-sm text-slate-600">
              今日中に確認したいタスクです。
            </p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
            {todayTasks.length}件
          </span>
        </div>

        {todayTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            今日期限のタスクはありません。
          </div>
        ) : (
          <div className="space-y-3">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-base font-bold text-slate-900">
                      {task.title || '無題タスク'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        状況: {getStatusLabel(task.status)}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        優先度: {getPriorityLabel(task.priority)}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-amber-700">
                        期限: {formatDate(task.due_date)}
                      </span>
                    </div>
                  </div>

                  {task.property_id ? (
                    <Link
                      href={`/properties/${task.property_id}/tasks`}
                      className="text-sm font-medium text-emerald-700 hover:underline"
                    >
                      物件タスクを見る
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">今後のタスク</h2>
            <p className="mt-1 text-sm text-slate-600">
              期限順で並べています。
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {upcomingTasks.length}件
          </span>
        </div>

        {upcomingTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            今後のタスクはありません。
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-base font-bold text-slate-900">
                      {task.title || '無題タスク'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        状況: {getStatusLabel(task.status)}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        優先度: {getPriorityLabel(task.priority)}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        期限: {formatDate(task.due_date)}
                      </span>
                    </div>
                  </div>

                  {task.property_id ? (
                    <Link
                      href={`/properties/${task.property_id}/tasks`}
                      className="text-sm font-medium text-emerald-700 hover:underline"
                    >
                      物件タスクを見る
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}