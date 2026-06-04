'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Profile = { id: string; displayName: string }

type Props = {
  basePath: string
  currentFilter: string
  currentAssigneeId: string
  currentSort?: string
  profiles: Profile[]
}

const FILTERS = [
  { key: 'mine', label: '自分' },
  { key: 'all', label: '全社' },
  { key: 'unassigned', label: '未設定' },
] as const

export default function CaseFilterBar({
  basePath,
  currentFilter,
  currentAssigneeId,
  currentSort,
  profiles,
}: Props) {
  const router = useRouter()

  const buildHref = (filter: string, assigneeId = '') => {
    const params = new URLSearchParams()
    params.set('filter', filter)
    if (assigneeId) params.set('assigneeId', assigneeId)
    if (currentSort) params.set('sort', currentSort)
    return `${basePath}?${params.toString()}`
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {FILTERS.map((f) => (
        <Link
          key={f.key}
          href={buildHref(f.key)}
          className={
            currentFilter === f.key
              ? 'inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white'
              : 'inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50'
          }
        >
          {f.label}
        </Link>
      ))}

      {profiles.length > 0 && (
        <select
          value={currentFilter === 'assignee' ? currentAssigneeId : ''}
          onChange={(e) => {
            if (e.target.value) router.push(buildHref('assignee', e.target.value))
          }}
          className={`h-10 rounded-md border px-3 text-sm font-semibold outline-none ${
            currentFilter === 'assignee'
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-300 bg-white text-slate-700'
          }`}
        >
          <option value="">担当者別</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.displayName}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
