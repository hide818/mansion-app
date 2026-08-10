'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type FunnelStep = {
  label: string
  value: number
  note: string
  rate: number | null
}

type DashboardData = {
  yearMonth: string
  funnel: FunnelStep[]
  gaOnlyMetrics: string[]
  summary: {
    totalFreeRegistered: number
    everUsed: number
    currentMonthUsed: number
    surveyAnswered: number
    ctaClicked: number
    kuraInterested: number
    trialStarted: number
    paidStarted: number
  }
}

export default function AdminFunnelPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/funnel')
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

  const maxVal = Math.max(...data.funnel.map(s => s.value), 1)

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-600">管理者ダッシュボード</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">営業しない営業 ファネル</h1>
            <p className="mt-1 text-sm text-slate-500">{data.yearMonth} 基準 · DBから取得可能な指標</p>
          </div>
          <Link
            href="/admin/free-minutes"
            className="text-sm font-medium text-slate-600 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 transition"
          >
            詳細モニタリング →
          </Link>
        </div>
      </section>

      {/* サマリーKPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: '無料登録', value: data.summary.totalFreeRegistered },
          { label: '初回利用（累計）', value: data.summary.everUsed },
          { label: 'Kura興味あり', value: data.summary.kuraInterested },
          { label: 'トライアル開始', value: data.summary.trialStarted },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{k.value}</p>
          </div>
        ))}
      </div>

      {/* ファネル */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-6">ファネル（DBから取得）</h2>
        <div className="space-y-3">
          {data.funnel.map((step, i) => {
            const barPct = maxVal > 0 ? Math.max(4, Math.round((step.value / maxVal) * 100)) : 4
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-4 text-right">{i + 1}</span>
                    <span className="text-sm font-medium text-slate-800">{step.label}</span>
                    <span className="text-xs text-slate-400">{step.note}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {step.rate !== null && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        step.rate >= 60 ? 'bg-emerald-100 text-emerald-700' :
                        step.rate >= 30 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {step.rate}%
                      </span>
                    )}
                    <span className="text-base font-bold text-slate-900 w-8 text-right">{step.value}</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden ml-6">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all"
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* GA4のみの指標 */}
      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">GA4のみで取得可能な指標</h2>
        <p className="text-xs text-slate-500 mb-4">
          以下はDBに記録されていないため、Google Analytics 4（GA4）から確認してください。<br />
          測定ID: <code className="font-mono text-xs bg-white border border-slate-200 px-1.5 py-0.5 rounded">G-0WJDGSES84</code>
        </p>
        <ul className="space-y-2">
          {data.gaOnlyMetrics.map(m => (
            <li key={m} className="flex items-start gap-2 text-sm text-slate-600">
              <span className="text-slate-400 mt-0.5">→</span>
              <span>{m}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 読み方 */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">ファネルの読み方</h2>
        <div className="space-y-3 text-sm text-slate-600">
          {[
            { cond: '登録は多いが初回利用が少ない', problem: '登録後の導線に課題がある可能性' },
            { cond: '初回利用は多いが2回目が少ない', problem: 'AI議事録のUX・価値実感に課題がある可能性' },
            { cond: '2回利用したがアンケート回答が少ない', problem: 'アンケートモーダルのタイミング・訴求に課題がある可能性' },
            { cond: '3回使ったがCTAクリックが少ない', problem: 'Kura本体への価値訴求・料金提示に課題がある可能性' },
            { cond: 'CTAクリックはあるがトライアル開始が少ない', problem: 'サインアップページ・料金への懸念に課題がある可能性' },
          ].map(r => (
            <div key={r.cond} className="flex gap-3">
              <span className="shrink-0 text-slate-400">→</span>
              <div>
                <span className="font-medium text-slate-800">{r.cond}</span>
                <span className="text-slate-500"> → {r.problem}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
