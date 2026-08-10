'use client'

import { useEffect, useState } from 'react'

type KPI = {
  totalRegistered: number
  neverUsed: number
  everUsed: number
  currentMonthUsers: number
  currentMonthGenerations: number
  totalGenerations: number
  used1: number
  used2: number
  used3: number
  exhaustedNormal: number
  surveyCount: number
  surveyRate: number
  bonusGranted: number
  exhaustedAll: number
  ctaClicks: number
}

type SurveyAgg = {
  q1: Record<string, number>
  q2: Record<string, number>
  q3: Record<string, number>
  total: number
}

type UserRow = {
  userId: string
  email: string
  registeredAt: string | null
  companyName: string
  currentMonthUsed: number
  currentMonthMax: number
  surveyBonusGranted: boolean
  surveyAnsweredThisMonth: boolean
  ctaClicked: boolean
  totalUsed: number
  firstUsedAt: string | null
  lastUsedAt: string | null
}

type SurveyRow = {
  user_id: string
  year_month: string
  q1_usability: string
  q2_current_time: string
  q3_kura_interest: string
  comment: string | null
  created_at: string
}

type DashboardData = {
  yearMonth: string
  kpi: KPI
  surveyAggregation: SurveyAgg
  users: UserRow[]
  surveys: SurveyRow[]
}

function fmt(s: string | null) {
  if (!s) return '—'
  const d = new Date(s)
  return d.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const Q1_LABELS: Record<string, string> = {
  ready: 'そのまま使えた',
  minor_edit: '少し修正',
  major_edit: '大幅修正',
  not_useful: '使えなかった',
}
const Q2_LABELS: Record<string, string> = {
  lt30: '30分未満',
  '30to60': '30〜60分',
  '60to120': '1〜2時間',
  '120to180': '2〜3時間',
  gt180: '3時間以上',
}
const Q3_LABELS: Record<string, string> = {
  yes: '興味あり',
  try: '無料試したい',
  more_info: '説明を聞きたい',
  not_interested: '興味なし',
}

function BarChart({ data, labels }: { data: Record<string, number>; labels: Record<string, string> }) {
  const total = Object.values(data).reduce((s, v) => s + v, 0)
  if (total === 0) return <p className="text-xs text-slate-400">データなし</p>
  return (
    <div className="space-y-2">
      {Object.entries(labels).map(([key, label]) => {
        const count = data[key] ?? 0
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        return (
          <div key={key}>
            <div className="flex justify-between text-xs text-slate-600 mb-0.5">
              <span>{label}</span>
              <span>{count}件 ({pct}%)</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-slate-900 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function AdminFreeMinutesPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'users' | 'surveys'>('users')

  useEffect(() => {
    fetch('/api/admin/free-minutes')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError('データの取得に失敗しました'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 text-sm text-slate-500">読み込み中…</div>
  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>
  if (!data) return null

  const { kpi, surveyAggregation, users, surveys } = data

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-emerald-600">管理者ダッシュボード</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">無料AI議事録 モニタリング</h1>
        <p className="mt-1 text-sm text-slate-500">{data.yearMonth} 基準</p>
      </section>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: '累計登録', value: kpi.totalRegistered, sub: `未使用 ${kpi.neverUsed}件` },
          { label: '当月利用者', value: kpi.currentMonthUsers, sub: `生成数 ${kpi.currentMonthGenerations}回` },
          { label: 'アンケート回答', value: kpi.surveyCount, sub: `回答率 ${kpi.surveyRate}%` },
          { label: 'Kura CTA クリック', value: kpi.ctaClicks, sub: `上限到達 ${kpi.exhaustedAll}件` },
        ].map(card => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500">{card.label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ファネル */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">当月ファネル</h2>
        <div className="flex items-end gap-3 overflow-x-auto pb-2">
          {[
            { label: '登録', value: kpi.totalRegistered, color: 'bg-slate-800' },
            { label: '1回利用', value: kpi.used1, color: 'bg-slate-700' },
            { label: '2回利用', value: kpi.used2, color: 'bg-emerald-700' },
            { label: 'アンケート', value: kpi.surveyCount, color: 'bg-emerald-600' },
            { label: '3回利用', value: kpi.used3, color: 'bg-emerald-500' },
            { label: 'CTA Click', value: kpi.ctaClicks, color: 'bg-blue-600' },
          ].map((step, i, arr) => {
            const maxVal = arr[0].value || 1
            const h = Math.max(12, Math.round((step.value / maxVal) * 120))
            return (
              <div key={step.label} className="flex flex-col items-center gap-1 min-w-[56px]">
                <span className="text-xs font-bold text-slate-700">{step.value}</span>
                <div className={`w-10 rounded-t-lg ${step.color}`} style={{ height: `${h}px` }} />
                <span className="text-xs text-slate-500 text-center leading-tight">{step.label}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* アンケート集計 */}
      {surveyAggregation.total > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">アンケート集計（当月 {surveyAggregation.total}件）</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Q1. 議事録の完成度</p>
              <BarChart data={surveyAggregation.q1} labels={Q1_LABELS} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Q2. 現在の作成時間</p>
              <BarChart data={surveyAggregation.q2} labels={Q2_LABELS} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Q3. Kuraへの興味</p>
              <BarChart data={surveyAggregation.q3} labels={Q3_LABELS} />
            </div>
          </div>
        </section>
      )}

      {/* タブ切り替え */}
      <div className="flex gap-2">
        {(['users', 'surveys'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition ${tab === t ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {t === 'users' ? `ユーザー一覧 (${users.length})` : `アンケート回答 (${surveys.length})`}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">会社名</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">メール</th>
                  <th className="text-center px-4 py-3 text-slate-500 font-medium">当月</th>
                  <th className="text-center px-4 py-3 text-slate-500 font-medium">累計</th>
                  <th className="text-center px-4 py-3 text-slate-500 font-medium">アンケート</th>
                  <th className="text-center px-4 py-3 text-slate-500 font-medium">CTA</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">最終利用</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.userId} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-800">{u.companyName}</td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold ${u.currentMonthUsed >= u.currentMonthMax ? 'bg-red-100 text-red-700' : u.currentMonthUsed > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {u.currentMonthUsed}/{u.currentMonthMax}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700 font-medium">{u.totalUsed}</td>
                    <td className="px-4 py-3 text-center">
                      {u.surveyAnsweredThisMonth ? (
                        <span className="text-emerald-600">✓</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.ctaClicked ? (
                        <span className="text-blue-600">✓</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{fmt(u.lastUsedAt)}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">登録ユーザーなし</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'surveys' && (
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">回答日時</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Q1 完成度</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Q2 作成時間</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Q3 Kura興味</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">コメント</th>
                </tr>
              </thead>
              <tbody>
                {surveys.map(s => (
                  <tr key={`${s.user_id}-${s.year_month}`} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-slate-400">{fmt(s.created_at)}</td>
                    <td className="px-4 py-3 text-slate-700">{Q1_LABELS[s.q1_usability] ?? s.q1_usability}</td>
                    <td className="px-4 py-3 text-slate-700">{Q2_LABELS[s.q2_current_time] ?? s.q2_current_time}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.q3_kura_interest === 'yes' ? 'bg-emerald-100 text-emerald-700' :
                        s.q3_kura_interest === 'try' ? 'bg-blue-100 text-blue-700' :
                        s.q3_kura_interest === 'more_info' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {Q3_LABELS[s.q3_kura_interest] ?? s.q3_kura_interest}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{s.comment ?? '—'}</td>
                  </tr>
                ))}
                {surveys.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">回答なし</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
