'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

export type TimelineEntry = {
  id: string
  type: 'case' | 'log' | 'task' | 'complaint' | 'minutes'
  typeLabel: string
  title: string
  description: string
  sortDate: string
  href: string
  status: string
  isOverdue: boolean
  isIncomplete: boolean
  isStagnant: boolean
}

type TimelineResponse = {
  entries?: TimelineEntry[]
  error?: string
}

type SummaryResponse = {
  summary?: string
  error?: string
}

type TypeFilterValue = '' | 'case' | 'log' | 'task' | 'complaint' | 'minutes'

const TYPE_FILTERS: { value: TypeFilterValue; label: string }[] = [
  { value: '', label: 'すべて' },
  { value: 'case', label: '案件' },
  { value: 'log', label: 'ログ' },
  { value: 'task', label: 'タスク' },
  { value: 'complaint', label: 'クレーム' },
  { value: 'minutes', label: '議事録' },
]

const TYPE_STYLES: Record<string, { badge: string; border: string }> = {
  case: {
    badge: 'bg-sky-100 text-sky-700',
    border: 'border-l-sky-400',
  },
  log: {
    badge: 'bg-slate-100 text-slate-600',
    border: 'border-l-slate-300',
  },
  task: {
    badge: 'bg-amber-100 text-amber-700',
    border: 'border-l-amber-400',
  },
  complaint: {
    badge: 'bg-rose-100 text-rose-700',
    border: 'border-l-rose-400',
  },
  minutes: {
    badge: 'bg-emerald-100 text-emerald-700',
    border: 'border-l-emerald-400',
  },
}

function formatDate(value: string) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

function getStatusLabel(status: string, type: string): string {
  if (!status) return ''
  if (type === 'task') {
    if (status === 'todo') return '未着手'
    if (status === 'doing') return '進行中'
    if (status === 'done') return '完了'
    if (status === 'pending') return '保留'
  }
  if (type === 'minutes') {
    if (status === 'draft') return '下書き'
    if (status === 'reviewing') return '確認中'
    if (status === 'finalized') return '確定済み'
    if (status === 'sent') return '送付済み'
  }
  if (type === 'case') {
    if (status === 'todo') return '未着手'
    if (status === 'doing') return '進行中'
    if (status === 'done') return '完了'
    if (status === 'pending') return '保留'
  }
  return status
}

function renderSummaryMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) {
      return (
        <h3 key={i} className="mt-4 text-sm font-bold text-emerald-900 first:mt-0">
          {line.slice(3)}
        </h3>
      )
    }
    if (line.startsWith('- ')) {
      return (
        <p key={i} className="mt-1 text-sm leading-6 text-emerald-800">
          • {line.slice(2)}
        </p>
      )
    }
    if (line.trim() === '' || line === '---') {
      return <div key={i} className="my-1" />
    }
    return (
      <p key={i} className="mt-1 text-sm leading-6 text-emerald-800">
        {line}
      </p>
    )
  })
}

export default function PropertyTimelineClient({
  propertyId,
}: {
  propertyId: string
}) {
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilterValue>('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const [summaryError, setSummaryError] = useState('')
  const [summaryOpen, setSummaryOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchTimeline() {
      try {
        setLoading(true)
        setError('')
        const res = await fetch(`/api/properties/${propertyId}/timeline`, {
          cache: 'no-store',
        })
        const data = (await res.json()) as TimelineResponse

        if (!res.ok || data.error) {
          if (!cancelled) setError(data.error ?? 'タイムラインの取得に失敗しました。')
          return
        }
        if (!cancelled) setEntries(data.entries ?? [])
      } catch (err) {
        console.error(err)
        if (!cancelled) setError('タイムラインの取得中にエラーが発生しました。')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchTimeline()
    return () => {
      cancelled = true
    }
  }, [propertyId])

  const filteredEntries = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return entries.filter((e) => {
      const matchType = typeFilter === '' || e.type === typeFilter
      const matchKeyword =
        !kw ||
        e.title.toLowerCase().includes(kw) ||
        e.description.toLowerCase().includes(kw)
      return matchType && matchKeyword
    })
  }, [entries, typeFilter, keyword])

  const warningCount = useMemo(
    () => entries.filter((e) => e.isOverdue || e.isStagnant).length,
    [entries],
  )

  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of entries) {
      map[e.type] = (map[e.type] ?? 0) + 1
    }
    return map
  }, [entries])

  async function handleSummary() {
    if (summaryLoading) return
    setSummaryLoading(true)
    setSummaryError('')
    setSummary('')
    setSummaryOpen(true)

    try {
      const res = await fetch(`/api/properties/${propertyId}/timeline/summary`, {
        method: 'POST',
        cache: 'no-store',
      })
      const data = (await res.json()) as SummaryResponse

      if (!res.ok || data.error) {
        setSummaryError(data.error ?? '要約の生成に失敗しました。')
        return
      }
      setSummary(data.summary ?? '')
    } catch (err) {
      console.error(err)
      setSummaryError('要約の生成中にエラーが発生しました。')
    } finally {
      setSummaryLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* ヘッダー */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">経緯タイムライン</h2>
          <p className="mt-1 text-sm text-slate-500">
            案件・ログ・タスク・クレーム・議事録を時系列で確認できます。
          </p>
          {!loading && warningCount > 0 && (
            <p className="mt-1.5 text-sm font-semibold text-amber-600">
              要注意: 期限切れ・停滞 {warningCount}件
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleSummary}
          disabled={summaryLoading || loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold !text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {summaryLoading ? '要約生成中...' : 'この物件の経緯を要約'}
        </button>
      </div>

      {/* AI 要約パネル */}
      {summaryOpen && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-emerald-900">AI 経緯要約</p>
            <button
              type="button"
              onClick={() => setSummaryOpen(false)}
              className="text-xs text-emerald-600 hover:text-emerald-900"
            >
              閉じる
            </button>
          </div>

          {summaryLoading && (
            <p className="mt-3 text-sm text-emerald-700">要約を生成しています...</p>
          )}
          {summaryError && (
            <p className="mt-3 text-sm text-red-600">{summaryError}</p>
          )}
          {summary && !summaryLoading && (
            <div className="mt-3">{renderSummaryMarkdown(summary)}</div>
          )}
        </div>
      )}

      {/* 検索・フィルター */}
      <div className="space-y-3">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="タイトル・内容でキーワード検索..."
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-500"
        />

        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((f) => {
            const count = f.value === '' ? entries.length : (typeCounts[f.value] ?? 0)
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setTypeFilter(f.value)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  typeFilter === f.value
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
                {!loading && (
                  <span className="ml-1 opacity-60">{count}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ローディング */}
      {loading && (
        <div className="rounded-2xl bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-500">読み込み中...</p>
        </div>
      )}

      {/* エラー */}
      {error && !loading && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 空状態 */}
      {!loading && !error && filteredEntries.length === 0 && (
        <div className="rounded-2xl bg-slate-50 p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">
            {entries.length === 0
              ? 'まだ記録がありません'
              : '条件に一致する記録がありません'}
          </p>
          {entries.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              絞り込み条件を変更するか、キーワードを消してください。
            </p>
          )}
        </div>
      )}

      {/* タイムライン */}
      {!loading && !error && filteredEntries.length > 0 && (
        <div className="space-y-2">
          {filteredEntries.map((entry) => {
            const styles = TYPE_STYLES[entry.type] ?? TYPE_STYLES.case
            const statusLabel = getStatusLabel(entry.status, entry.type)
            const rowBg = entry.isOverdue
              ? 'bg-red-50 ring-red-100'
              : entry.isStagnant
                ? 'bg-amber-50 ring-amber-100'
                : 'bg-white ring-gray-100'

            return (
              <div
                key={`${entry.type}-${entry.id}`}
                className={`rounded-xl border-l-4 p-4 shadow-sm ring-1 ${styles.border} ${rowBg}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {/* 種別バッジ */}
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${styles.badge}`}
                  >
                    {entry.typeLabel}
                  </span>

                  {/* 警告バッジ */}
                  {entry.isOverdue && (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                      期限切れ
                    </span>
                  )}
                  {entry.isStagnant && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      30日停滞
                    </span>
                  )}
                  {entry.isIncomplete &&
                    !entry.isOverdue &&
                    !entry.isStagnant &&
                    (entry.type === 'task' || entry.type === 'complaint') && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        未完了
                      </span>
                    )}

                  {/* 日付 */}
                  <span className="ml-auto text-xs text-slate-400">
                    {formatDate(entry.sortDate)}
                  </span>
                </div>

                <div className="mt-2">
                  <Link
                    href={entry.href}
                    className="text-sm font-semibold text-slate-900 hover:text-sky-700 hover:underline"
                  >
                    {entry.title}
                  </Link>

                  {entry.description && (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                      {entry.description}
                    </p>
                  )}

                  {statusLabel && (
                    <p className="mt-1 text-xs text-slate-400">
                      状態: {statusLabel}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 件数表示 */}
      {!loading && filteredEntries.length > 0 && (
        <p className="text-center text-xs text-slate-400">
          {filteredEntries.length}件を表示
          {entries.length !== filteredEntries.length && ` ／ 全${entries.length}件`}
        </p>
      )}
    </div>
  )
}
