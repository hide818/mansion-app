import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type TaskRow = {
  id: string
  title: string | null
  status: string | null
  due_date: string | null
  property_id: string | null
  created_at: string | null
}

type PropertyRow = {
  id: string
  name: string | null
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

function sortByDueDate(tasks: TaskRow[]) {
  return [...tasks].sort((a, b) => {
    if (!a.due_date && !b.due_date) {
      return (b.created_at ?? '').localeCompare(a.created_at ?? '')
    }

    if (!a.due_date) return 1
    if (!b.due_date) return -1

    return a.due_date.localeCompare(b.due_date)
  })
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const [{ data: taskData, error: taskError }, { data: propertyData, error: propertyError }] =
    await Promise.all([
      supabase
        .from('tasks')
        .select('id, title, status, due_date, property_id, created_at')
        .eq('company_id', companyId)
        .neq('status', 'done'),
      supabase
        .from('properties')
        .select('id, name, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

  if (taskError || propertyError) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-600">ダッシュボード</p>
          <h1 className="mt-1 text-3xl font-bold text-red-700">データの取得に失敗しました</h1>
          <div className="mt-4 space-y-2 text-sm text-red-600">
            {taskError ? <p>tasks: {taskError.message}</p> : null}
            {propertyError ? <p>properties: {propertyError.message}</p> : null}
          </div>
        </div>
      </div>
    )
  }

  const tasks = sortByDueDate((taskData ?? []) as TaskRow[])
  const properties = (propertyData ?? []) as PropertyRow[]

  const overdueTasks = tasks.filter((task) => isOverdue(task.due_date))
  const todayTasks = tasks.filter((task) => isToday(task.due_date))
  const upcomingTasks = tasks.filter(
    (task) => !isToday(task.due_date) && !isOverdue(task.due_date),
  )

  const urgentList = [...overdueTasks, ...todayTasks].slice(0, 5)
  const nextList = upcomingTasks.slice(0, 5)

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">ホーム</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">今日の仕事画面</h1>
            <p className="mt-2 text-sm text-slate-600">
              期限が近いタスクから順番に確認できます。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/today-tasks"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              今日やることを見る
            </Link>
            <Link
              href="/tasks"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              タスク一覧へ
            </Link>
            <Link
              href="/cases"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              案件一覧へ
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-red-600">期限切れ</p>
          <p className="mt-2 text-3xl font-bold text-red-700">{overdueTasks.length}</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-amber-600">今日期限</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">{todayTasks.length}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">未完了タスク</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{tasks.length}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">先にやること</h2>
                <p className="mt-1 text-sm text-slate-600">
                  期限切れと今日期限のタスクです。
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                {urgentList.length}件
              </span>
            </div>

            {urgentList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                先にやるタスクはありません。
              </div>
            ) : (
              <div className="space-y-3">
                {urgentList.map((task) => {
                  const overdue = isOverdue(task.due_date)

                  return (
                    <div
                      key={task.id}
                      className={`rounded-2xl border p-4 ${
                        overdue
                          ? 'border-red-200 bg-red-50'
                          : 'border-amber-200 bg-amber-50'
                      }`}
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
                            <span
                              className={`rounded-full bg-white px-2 py-1 ${
                                overdue ? 'text-red-700' : 'text-amber-700'
                              }`}
                            >
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
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">このあとやること</h2>
                <p className="mt-1 text-sm text-slate-600">
                  期限順で並んでいます。
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                {nextList.length}件
              </span>
            </div>

            {nextList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                今後のタスクはありません。
              </div>
            ) : (
              <div className="space-y-3">
                {nextList.map((task) => (
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
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">最近の物件</h2>
              <Link
                href="/properties"
                className="text-sm font-medium text-emerald-700 hover:underline"
              >
                物件一覧へ
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {properties.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                  物件データはまだありません。
                </div>
              ) : (
                properties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/properties/${property.id}`}
                    className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {property.name || '無題物件'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      登録日: {formatDate(property.created_at)}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}