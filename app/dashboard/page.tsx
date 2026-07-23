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
      .select('display_name')
      .eq('id', currentProfile.id)
      .eq('company_id', companyId)
      .maybeSingle()
    if (nameData) {
      userName = (nameData.display_name as string | null) || currentProfile.email?.split('@')[0] || 'あなた'
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

  const isNewUser = properties.length === 0 && tasks.length === 0

  return (
    <div className="space-y-6 p-6">

      {/* 初回オンボーディング */}
      {isNewUser && (
        <section className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white shadow-lg shadow-blue-500/30 sm:h-12 sm:w-12 sm:text-2xl">K</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-blue-500">Kuraへようこそ！</p>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">{userName.split('@')[0]} さん</h2>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">3ステップで使い始められます。まず物件を登録してください。</p>
              <div className="mt-4 space-y-3">
                {[
                  { step: 1, label: '物件を登録する', desc: 'CSVインポートで一括追加', href: '/import', color: 'bg-blue-600', done: false },
                  { step: 2, label: 'CSVで一括インポート', desc: 'ExcelデータをKuraに移行', href: '/import', color: 'bg-slate-600', done: false },
                  { step: 3, label: 'AI議事録を試す', desc: '音声→議事録を体験', href: '/ai-minutes', color: 'bg-green-600', done: false },
                ].map(s => (
                  <a key={s.step} href={s.href} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-blue-300 hover:shadow-sm transition">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${s.color} text-xs font-bold text-white`}>{s.step}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{s.label}</p>
                      <p className="text-xs text-slate-400">{s.desc}</p>
                    </div>
                    <svg className="ml-auto h-4 w-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* グリーティング */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{todayLabel()}</p>
            <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
              おはようございます、<br className="sm:hidden" />{userName.split('@')[0]} さん
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {overdueTasks.length > 0
                ? `期限切れタスクが ${overdueTasks.length} 件あります。先に確認してください。`
                : todayTasks.length > 0
                ? `今日期限のタスクが ${todayTasks.length} 件あります。`
                : '今日の緊急タスクはありません。'}
            </p>
          </div>
        </div>
      </section>

      {/* プッシュ通知セットアップ */}
      <PushNotificationSetup />

      {/* 管理者専用リンク（オーナーのみ） */}
      {currentProfile?.role === 'admin' && currentProfile?.email === process.env.OWNER_EMAIL && (
        <section>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">管理者メニュー</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/admin"
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-[#070E1C] p-5 shadow-sm transition hover:border-blue-400">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/20">
                <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
              </div>
              <div>
                <p className="font-bold text-white">Kura Admin</p>
                <p className="text-xs text-slate-400 mt-0.5">会社管理・利用状況・統計</p>
              </div>
            </Link>
            <Link href="/leads"
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-purple-400 hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 group-hover:bg-purple-100">
                <svg className="h-6 w-6 text-purple-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
              </div>
              <div>
                <p className="font-bold text-slate-800">見込み顧客リスト</p>
                <p className="text-xs text-slate-400 mt-0.5">お問い合わせ管理・ステータス</p>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* 3本柱クイックアクション */}
      <section>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">AI機能</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/ai-minutes"
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100">
              <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
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
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 group-hover:bg-green-100">
              <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
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
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 group-hover:bg-amber-100">
              <svg className="h-6 w-6 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
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
                { href: '/help', label: '使い方ガイド' },
                { href: '/ai-minutes/records', label: '保存済み議事録' },
                { href: '/handover-documents', label: '引き継ぎ書一覧' },
                { href: '/manager', label: '危険案件ダッシュボード' },
                { href: '/settings/minutes-template', label: '議事録フォーマット設定' },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
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
