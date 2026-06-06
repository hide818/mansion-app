import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { getUserProfile } from '@/lib/getUserProfile'
import { formatDate, isToday, isOverdue, getStatusLabel } from '@/lib/utils'
import DashboardAlertsClient from '@/app/components/DashboardAlertsClient'
import PushNotificationSetup from '@/app/components/PushNotificationSetup'

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
    if (!a.due_date && !b.due_date) return (b.created_at ?? '').localeCompare(a.created_at ?? '')
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return a.due_date.localeCompare(b.due_date)
  })
}

function todayLabel() {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date())
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()
  const currentProfile = await getUserProfile()

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
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-600">データの取得に失敗しました</p>
          {taskError && <p className="text-xs text-red-500 mt-1">tasks: {taskError.message}</p>}
          {propertyError && <p className="text-xs text-red-500 mt-1">properties: {propertyError.message}</p>}
        </div>
      </div>
    )
  }

  const tasks = sortByDueDate((taskData ?? []) as TaskRow[])
  const properties = (propertyData ?? []) as PropertyRow[]
  const overdueTasks = tasks.filter((t) => isOverdue(t.due_date))
  const todayTasks = tasks.filter((t) => isToday(t.due_date))
  const upcomingTasks = tasks.filter((t) => !isToday(t.due_date) && !isOverdue(t.due_date))
  const urgentList = [...overdueTasks, ...todayTasks].slice(0, 5)
  const nextList = upcomingTasks.slice(0, 5)

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

      {/* グリーティング */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{todayLabel()}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              おはようございます、{userName.split('@')[0]} さん
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {overdueTasks.length > 0
                ? `⚠️ 期限切れタスクが ${overdueTasks.length} 件あります。先に確認してください。`
                : todayTasks.length > 0
                ? `📅 今日期限のタスクが ${todayTasks.length} 件あります。`
                : '今日の緊急タスクはありません。'}
            </p>
          </div>
        </div>
      </section>

      {/* プッシュ通知セットアップ */}
      <PushNotificationSetup />

      {/* 3本柱クイックアクション */}
      <section>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">AI機能</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/ai-minutes"
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl group-hover:bg-blue-100">
              🎙️
            </div>
            <div>
              <p className="font-bold text-slate-800">AI議事録を作成</p>
              <p className="text-xs text-slate-400 mt-0.5">録音→議事録を3分で</p>
            </div>
          </Link>
          <Link
            href="/handover-documents/new"
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-2xl group-hover:bg-green-100">
              📄
            </div>
            <div>
              <p className="font-bold text-slate-800">AI引き継ぎ書を作成</p>
              <p className="text-xs text-slate-400 mt-0.5">物件選択→即自動生成</p>
            </div>
          </Link>
          <Link
            href="/cases"
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-2xl group-hover:bg-amber-100">
              📋
            </div>
            <div>
              <p className="font-bold text-slate-800">全案件を確認</p>
              <p className="text-xs text-slate-400 mt-0.5">全物件の案件を一覧で</p>
            </div>
          </Link>
        </div>
      </section>

      {/* サマリーカード */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className={`rounded-xl border p-5 shadow-sm ${overdueTasks.length > 0 ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'}`}>
          <p className={`text-sm font-semibold ${overdueTasks.length > 0 ? 'text-rose-600' : 'text-slate-500'}`}>期限切れ</p>
          <p className={`mt-2 text-4xl font-extrabold ${overdueTasks.length > 0 ? 'text-rose-700' : 'text-slate-800'}`}>{overdueTasks.length}</p>
          <p className="mt-1 text-xs text-slate-400">件</p>
        </div>
        <div className={`rounded-xl border p-5 shadow-sm ${todayTasks.length > 0 ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
          <p className={`text-sm font-semibold ${todayTasks.length > 0 ? 'text-amber-600' : 'text-slate-500'}`}>今日期限</p>
          <p className={`mt-2 text-4xl font-extrabold ${todayTasks.length > 0 ? 'text-amber-700' : 'text-slate-800'}`}>{todayTasks.length}</p>
          <p className="mt-1 text-xs text-slate-400">件</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">未完了タスク</p>
          <p className="mt-2 text-4xl font-extrabold text-slate-800">{tasks.length}</p>
          <p className="mt-1 text-xs text-slate-400">件（自分担当）</p>
        </div>
      </section>

      {/* アラート */}
      <DashboardAlertsClient />

      {/* タスクリスト + 物件 */}
      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">

          {/* 先にやること */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">先にやること</h2>
                <p className="text-xs text-slate-400 mt-0.5">期限切れ・今日期限のタスク</p>
              </div>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-bold text-rose-700">
                {urgentList.length}件
              </span>
            </div>
            {urgentList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
                緊急タスクなし — 今日も順調です
              </div>
            ) : (
              <div className="space-y-3">
                {urgentList.map((task) => {
                  const overdue = isOverdue(task.due_date)
                  return (
                    <div key={task.id} className={`rounded-xl border p-4 ${overdue ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'}`}>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{task.title || '無題タスク'}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
                            <span className="rounded-full bg-white px-2 py-0.5 text-slate-600">{getStatusLabel(task.status)}</span>
                            <span className={`rounded-full bg-white px-2 py-0.5 ${overdue ? 'text-rose-600 font-semibold' : 'text-amber-600'}`}>
                              期限: {formatDate(task.due_date)}
                            </span>
                          </div>
                        </div>
                        {task.property_id && validPropertyIdSet.has(task.property_id) && (
                          <Link href={`/properties/${task.property_id}/tasks`} className="shrink-0 text-xs font-medium text-blue-600 hover:underline">
                            物件を見る →
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* このあとやること */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">このあとやること</h2>
                <p className="text-xs text-slate-400 mt-0.5">期限順</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                {nextList.length}件
              </span>
            </div>
            {nextList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
                今後のタスクはありません
              </div>
            ) : (
              <div className="space-y-3">
                {nextList.map((task) => (
                  <div key={task.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{task.title || '無題タスク'}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
                          <span className="rounded-full bg-white px-2 py-0.5 text-slate-500">{getStatusLabel(task.status)}</span>
                          <span className="rounded-full bg-white px-2 py-0.5 text-slate-500">期限: {formatDate(task.due_date)}</span>
                        </div>
                      </div>
                      {task.property_id && (
                        <Link href={`/properties/${task.property_id}/tasks`} className="shrink-0 text-xs font-medium text-blue-600 hover:underline">
                          物件を見る →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右カラム */}
        <div className="space-y-6">

          {/* 最近の物件 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">物件</h2>
              <Link href="/properties" className="text-xs font-medium text-blue-600 hover:underline">
                すべて見る →
              </Link>
            </div>
            {properties.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
                物件がまだ登録されていません
              </div>
            ) : (
              <div className="space-y-2">
                {properties.map((property) => (
                  <Link key={property.id} href={`/properties/${property.id}`} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:bg-slate-100 transition">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{property.name || '無題物件'}</p>
                      <p className="text-xs text-slate-400">{formatDate(property.created_at)}</p>
                    </div>
                    <span className="text-slate-300 text-sm">›</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ショートカット */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">よく使う機能</h2>
            <div className="space-y-2">
              {[
                { href: '/ai-minutes/records', label: '保存済み議事録', icon: '📑' },
                { href: '/handover-documents', label: '引き継ぎ書一覧', icon: '📂' },
                { href: '/manager', label: '危険案件ダッシュボード', icon: '🚨' },
                { href: '/settings/minutes-template', label: '議事録フォーマット設定', icon: '⚙️' },
              ].map(({ href, label, icon }) => (
                <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                  <span>{icon}</span>
                  {label}
                  <span className="ml-auto text-slate-300">›</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}
