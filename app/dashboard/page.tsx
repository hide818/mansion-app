import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { getUserProfile } from '@/lib/getUserProfile'
import { formatDate, isToday, isOverdue, getStatusLabel } from '@/lib/utils'
import DashboardAlertsClient from '@/app/components/DashboardAlertsClient'
import { primaryButtonClass, secondaryButtonClass } from '@/app/components/ui/buttonStyles'

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
  const currentProfile = await getUserProfile()

  // 表示名を1回だけ取得（company_id で絞る）
  let userName = 'あなた'
  if (currentProfile?.id) {
    const { data: nameData } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', currentProfile.id)
      .eq('company_id', companyId)
      .maybeSingle()
    if (nameData) {
      userName = (nameData.display_name as string | null) || (nameData.email as string | null) || 'あなた'
    }
  }

  // タスクを自分担当に絞る
  let taskQuery = supabase
    .from('tasks')
    .select('id, title, status, due_date, property_id, created_at')
    .eq('company_id', companyId)
    .neq('status', 'done')

  if (currentProfile?.id) {
    taskQuery = taskQuery.eq('assigned_to', currentProfile.id)
  } else {
    taskQuery = taskQuery.is('assigned_to', null)
  }

  const [{ data: taskData, error: taskError }, { data: propertyData, error: propertyError }] =
    await Promise.all([
      taskQuery,
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
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
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

  // 有効な property_id のみリンクを表示するため、DBに存在するものだけ取得
  const taskPropertyIds = Array.from(
    new Set(tasks.map((t) => t.property_id).filter((v): v is string => typeof v === 'string' && v.length > 0))
  )
  const validPropertyIdSet = new Set<string>()
  if (taskPropertyIds.length > 0) {
    const { data: validProps } = await supabase
      .from('properties')
      .select('id')
      .eq('company_id', companyId)
      .in('id', taskPropertyIds)
    ;((validProps ?? []) as { id: string }[]).forEach((p) => validPropertyIdSet.add(p.id))
  }

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">ホーム</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">{userName} の仕事画面</h1>
            <p className="mt-2 text-sm text-slate-600">
              自分担当の期限が近いタスクから順番に確認できます。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/today-tasks" className={primaryButtonClass}>
              今日やることを見る
            </Link>
            <Link href="/ai-minutes" className={secondaryButtonClass}>
              AI議事録を作成
            </Link>
            <Link href="/ai-minutes/records" className={secondaryButtonClass}>
              保存済み議事録
            </Link>
            <Link href="/tasks" className={secondaryButtonClass}>
              タスク一覧へ
            </Link>
            <Link href="/cases" className={secondaryButtonClass}>
              案件一覧へ
            </Link>
          </div>
        </div>
      </section>

      <DashboardAlertsClient />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-rose-700">期限切れ</p>
          <p className="mt-2 text-3xl font-bold text-rose-800">{overdueTasks.length}</p>
        </div>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-amber-600">今日期限</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">{todayTasks.length}</p>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">未完了タスク</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{tasks.length}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
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
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                先にやるタスクはありません。
              </div>
            ) : (
              <div className="space-y-3">
                {urgentList.map((task) => {
                  const overdue = isOverdue(task.due_date)

                  return (
                    <div
                      key={task.id}
                      className={`rounded-md border p-4 ${
                        overdue
                          ? 'border-rose-200 bg-rose-50'
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
                                overdue ? 'text-rose-700' : 'text-amber-700'
                              }`}
                            >
                              期限: {formatDate(task.due_date)}
                            </span>
                          </div>
                        </div>

                        {task.property_id && validPropertyIdSet.has(task.property_id) ? (
                          <Link
                            href={`/properties/${task.property_id}/tasks`}
                            className="text-sm font-medium text-slate-600 hover:underline"
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

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
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
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                今後のタスクはありません。
              </div>
            ) : (
              <div className="space-y-3">
                {nextList.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-md border border-slate-200 bg-slate-50 p-4"
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
                          className="text-sm font-medium text-slate-600 hover:underline"
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
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">最近の物件</h2>
              <Link
                href="/properties"
                className="text-sm font-medium text-slate-600 hover:underline"
              >
                物件一覧へ
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {properties.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                  物件データはまだありません。
                </div>
              ) : (
                properties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/properties/${property.id}`}
                    className="block rounded-md border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100"
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
