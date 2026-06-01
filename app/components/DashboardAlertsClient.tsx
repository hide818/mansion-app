'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type DashboardAlert = {
  id: string
  type: 'task_overdue' | 'task_today' | 'task_upcoming' | 'case_stalled' | 'complaint_open'
  severity: 'urgent' | 'warning' | 'info'
  propertyId: string | null
  propertyName: string
  title: string
  reason: string
  dateLabel: string
  daysLabel?: string
  href?: string
}

type AlertsResponse = {
  alerts?: DashboardAlert[]
  error?: string
}

function typeLabel(type: DashboardAlert['type']): string {
  switch (type) {
    case 'task_overdue': return '期限切れタスク'
    case 'task_today': return '本日期限タスク'
    case 'task_upcoming': return '期限近タスク'
    case 'case_stalled': return '停滞案件'
    case 'complaint_open': return '未完了クレーム'
  }
}

function AlertCard({ alert }: { alert: DashboardAlert }) {
  const borderColor =
    alert.severity === 'urgent'
      ? 'border-red-200 bg-red-50'
      : alert.severity === 'warning'
        ? 'border-amber-200 bg-amber-50'
        : 'border-slate-200 bg-slate-50'

  const tagColor =
    alert.severity === 'urgent'
      ? 'bg-red-100 text-red-700'
      : alert.severity === 'warning'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-slate-100 text-slate-600'

  return (
    <div className={`rounded-2xl border p-4 ${borderColor}`}>
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tagColor}`}>
              {typeLabel(alert.type)}
            </span>
            {alert.daysLabel && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tagColor}`}>
                {alert.daysLabel}
              </span>
            )}
            <span className="text-xs text-slate-500">{alert.propertyName}</span>
          </div>
          <p className="mt-1.5 text-sm font-bold text-slate-900 leading-snug">
            {alert.title}
          </p>
          <p className="mt-1 text-xs text-slate-600">{alert.reason}</p>
          <p className="mt-0.5 text-xs text-slate-400">{alert.dateLabel}</p>
        </div>
        {alert.href && (
          <Link
            href={alert.href}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200"
          >
            確認する
          </Link>
        )}
      </div>
    </div>
  )
}

function SeveritySection({
  label,
  count,
  alerts,
  defaultOpen,
}: {
  label: string
  count: number
  alerts: DashboardAlert[]
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  if (count === 0) return null

  const headerColor =
    label === '緊急'
      ? 'text-red-700 bg-red-50 border-red-200'
      : label === '注意'
        ? 'text-amber-700 bg-amber-50 border-amber-200'
        : 'text-slate-600 bg-slate-50 border-slate-200'

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors ${headerColor}`}
      >
        <span>
          {label}
          <span className="ml-2 font-normal opacity-80">{count}件</span>
        </span>
        <span className="text-xs opacity-60">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardAlertsClient() {
  const [alerts, setAlerts] = useState<DashboardAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/dashboard/alerts')
      .then((r) => r.json())
      .then((data: AlertsResponse) => {
        if (data.error) {
          setError(data.error)
        } else {
          setAlerts(data.alerts ?? [])
        }
      })
      .catch(() => setError('アラートの取得に失敗しました。'))
      .finally(() => setLoading(false))
  }, [])

  const urgent = alerts.filter((a) => a.severity === 'urgent')
  const warning = alerts.filter((a) => a.severity === 'warning')
  const info = alerts.filter((a) => a.severity === 'info')

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* ヘッダー */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">今日見るべき対応</h2>
          <p className="mt-1 text-sm text-slate-500">
            期限切れ・停滞案件・未完了クレームを自動で抽出します。
          </p>
        </div>

        {!loading && !error && alerts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {urgent.length > 0 && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                緊急 {urgent.length}件
              </span>
            )}
            {warning.length > 0 && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                注意 {warning.length}件
              </span>
            )}
            {info.length > 0 && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                予定 {info.length}件
              </span>
            )}
          </div>
        )}
      </div>

      {/* ローディング */}
      {loading && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          対応アラートを確認しています...
        </div>
      )}

      {/* エラー */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 0件 */}
      {!loading && !error && alerts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          現在、緊急対応はありません。
        </div>
      )}

      {/* アラート一覧 */}
      {!loading && !error && alerts.length > 0 && (
        <div className="space-y-3">
          <SeveritySection
            label="緊急"
            count={urgent.length}
            alerts={urgent}
            defaultOpen={true}
          />
          <SeveritySection
            label="注意"
            count={warning.length}
            alerts={warning}
            defaultOpen={urgent.length === 0}
          />
          <SeveritySection
            label="予定"
            count={info.length}
            alerts={info}
            defaultOpen={urgent.length === 0 && warning.length === 0}
          />
        </div>
      )}
    </div>
  )
}
