import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/getUserProfile'
import { getRiskSummary, type AssigneeRisk } from '@/lib/managerRiskSummary'

function RiskBadge({ level }: { level: AssigneeRisk['riskLevel'] }) {
  if (level === 'critical') {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
        要対応
      </span>
    )
  }
  if (level === 'warning') {
    return (
      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-700">
        注意
      </span>
    )
  }
  return (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
      正常
    </span>
  )
}

export default async function ManagerPage() {
  const profile = await getUserProfile()

  if (!profile) redirect('/login')

  const isAdmin = profile.role === 'admin' || profile.can_view_all_data === true
  if (!isAdmin) redirect('/dashboard')

  const companyId = profile.company_id

  if (!companyId) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          所属会社が設定されていません。profiles.company_id を確認してください。
        </div>
      </div>
    )
  }

  const summary = await getRiskSummary(companyId)

  const today = new Date()
  const dateLabel = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(today)

  return (
    <div className="space-y-6 p-6">
      {/* ヘッダー */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-600">管理者ダッシュボード</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">朝の危険案件確認</h1>
            <p className="mt-1 text-sm text-slate-500">{dateLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/alerts/overdue-tasks"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              期限切れ詳細
            </Link>
            <Link
              href="/alerts/stale-cases"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              停滞案件詳細
            </Link>
          </div>
        </div>
      </section>

      {/* KPIカード4枚 */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/alerts/overdue-tasks"
          className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm transition hover:border-red-400 hover:shadow-md"
        >
          <p className="text-sm font-medium text-red-600">期限切れタスク</p>
          <p className="mt-2 text-4xl font-bold text-red-700">{summary.overdueTaskTotal}</p>
          <p className="mt-2 text-xs text-red-500">期限を過ぎた未完了タスク</p>
        </Link>

        <Link
          href="/alerts/stale-cases"
          className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 shadow-sm transition hover:border-yellow-400 hover:shadow-md"
        >
          <p className="text-sm font-medium text-yellow-700">停滞案件</p>
          <p className="mt-2 text-4xl font-bold text-yellow-800">{summary.staleCaseTotal}</p>
          <p className="mt-2 text-xs text-yellow-600">14日以上更新なし</p>
        </Link>

        <Link
          href="/complaints"
          className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm transition hover:border-orange-400 hover:shadow-md"
        >
          <p className="text-sm font-medium text-orange-600">未解決クレーム</p>
          <p className="mt-2 text-4xl font-bold text-orange-700">{summary.openComplaintTotal}</p>
          <p className="mt-2 text-xs text-orange-500">対応完了していないクレーム</p>
        </Link>

        <Link
          href="/handover-documents/new"
          className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
        >
          <p className="text-sm font-medium text-blue-600">引き継ぎ未整備</p>
          <p className="mt-2 text-4xl font-bold text-blue-700">{summary.handoverMissingCount}</p>
          <p className="mt-2 text-xs text-blue-500">引き継ぎ書が未作成の物件</p>
        </Link>
      </section>

      {/* 担当者別リスクテーブル */}
      {summary.assigneeRisks.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-slate-900">担当者別 危険案件</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4">担当者</th>
                  <th className="pb-3 pr-4 text-right text-red-600">期限切れ</th>
                  <th className="pb-3 pr-4 text-right text-yellow-600">停滞案件</th>
                  <th className="pb-3 pr-4 text-right text-orange-600">クレーム</th>
                  <th className="pb-3 pr-4 text-right">合計</th>
                  <th className="pb-3">状態</th>
                </tr>
              </thead>
              <tbody>
                {summary.assigneeRisks.map((ar) => (
                  <tr
                    key={ar.assigneeId ?? '__unassigned__'}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium text-slate-900">{ar.assigneeName}</td>
                    <td className="py-3 pr-4 text-right">
                      <span className={ar.overdueTaskCount > 0 ? 'font-bold text-red-600' : 'text-slate-400'}>
                        {ar.overdueTaskCount}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className={ar.staleCaseCount > 0 ? 'font-bold text-yellow-700' : 'text-slate-400'}>
                        {ar.staleCaseCount}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className={ar.openComplaintCount > 0 ? 'font-bold text-orange-600' : 'text-slate-400'}>
                        {ar.openComplaintCount}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right font-bold text-slate-900">{ar.total}</td>
                    <td className="py-3">
                      <RiskBadge level={ar.riskLevel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 放置案件ランキング */}
      {summary.staleCaseRanking.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-xl font-bold text-slate-900">放置案件ランキング</h2>
          <p className="mb-4 text-xs text-slate-500">停滞日数が多い順（最大10件）</p>
          <div className="space-y-2">
            {summary.staleCaseRanking.map((item, i) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-yellow-300 hover:bg-yellow-50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      {item.propertyName}
                      {item.assigneeName !== '担当未設定' && ` · ${item.assigneeName}`}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">
                  {item.staleDays}日停滞
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 引き継ぎ未整備物件 */}
      {summary.handoverMissingProperties.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">引き継ぎ書 未作成の物件</h2>
            <Link
              href="/handover-documents/new"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              今すぐ作成
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {summary.handoverMissingProperties.map((prop) => (
              <Link
                key={prop.id}
                href={prop.href}
                className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 transition hover:border-blue-300 hover:bg-blue-100"
              >
                <span className="font-medium">{prop.name}</span>
                <span className="text-xs text-blue-500">AI生成 →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 問題なし */}
      {summary.overdueTaskTotal === 0 &&
        summary.staleCaseTotal === 0 &&
        summary.openComplaintTotal === 0 && (
          <section className="rounded-3xl border border-green-200 bg-green-50 p-6 shadow-sm">
            <p className="text-center text-sm font-semibold text-green-700">
              現在、緊急対応が必要な案件はありません。
            </p>
          </section>
        )}
    </div>
  )
}
