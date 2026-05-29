import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type NavCard = {
  title: string
  description: string
  href: string
  badge: string
}

const NAV_CARDS: NavCard[] = [
  {
    title: '案件リスク判定',
    description: '担当未設定・期限切れ・停滞をスコアで一覧確認',
    href: '/analytics/case-risk',
    badge: '毎朝確認',
  },
  {
    title: '停滞案件',
    description: '長期間更新されていない案件を一覧',
    href: '/alerts/stale-cases',
    badge: 'アラート',
  },
  {
    title: '期限超過タスク',
    description: '期限を過ぎた未完了タスクを確認',
    href: '/alerts/overdue-tasks',
    badge: 'アラート',
  },
  {
    title: '担当者別負荷',
    description: '担当者ごとの案件・タスク数を把握',
    href: '/analytics/assignee-workload',
    badge: '分析',
  },
  {
    title: '案件温度',
    description: '炎上・注意・平和で案件状態を分類',
    href: '/analytics/case-temperature',
    badge: '分析',
  },
  {
    title: '物件ヘルス',
    description: '物件単位の健全度スコアを確認',
    href: '/analytics/property-health',
    badge: '分析',
  },
]

export default async function ManagerPage() {
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

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const [
    { count: overdueTaskCount },
    { count: openCaseCount },
    { count: propertyCount },
  ] = await Promise.all([
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .lt('due_date', todayStr)
      .neq('status', 'done'),
    supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .neq('status', 'done'),
    supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId),
  ])

  const hasOverdue = (overdueTaskCount ?? 0) > 0

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-emerald-600">管理者ダッシュボード</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">全体状況の確認</h1>
        <p className="mt-2 text-sm text-slate-600">
          リスク判定・停滞アラート・分析レポートの入口をまとめています。
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div
          className={`rounded-2xl border p-5 shadow-sm ${
            hasOverdue ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'
          }`}
        >
          <p className={`text-sm font-medium ${hasOverdue ? 'text-red-600' : 'text-slate-500'}`}>
            期限切れタスク
          </p>
          <p className={`mt-2 text-3xl font-bold ${hasOverdue ? 'text-red-700' : 'text-slate-900'}`}>
            {overdueTaskCount ?? 0}
          </p>
          <p className="mt-2 text-xs text-slate-500">期限を過ぎた未完了タスク</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">進行中案件</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{openCaseCount ?? 0}</p>
          <p className="mt-2 text-xs text-slate-500">完了以外の案件数</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">管理物件数</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{propertyCount ?? 0}</p>
          <p className="mt-2 text-xs text-slate-500">担当物件の合計</p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-slate-900">確認メニュー</h2>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {NAV_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-900">{card.title}</p>
                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-600">
                  {card.badge}
                </span>
              </div>
              <p className="text-xs leading-5 text-slate-500">{card.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
