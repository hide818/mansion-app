import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { getUserProfile } from '@/lib/getUserProfile'
import { isValidUuid } from '@/lib/isValidUuid'
import CaseFilterBar from '@/app/components/CaseFilterBar'
import {
  formatDate,
  getStatusLabel,
  pickCaseTitle,
  pickCaseDueDate,
  getDueLevel,
  type DueLevel,
} from '@/lib/utils'

type SearchParams = Promise<{
  sort?: string
  filter?: string
  assigneeId?: string
}>

type FilterKey = 'mine' | 'all' | 'unassigned' | 'assignee'

function normalizeFilter(value?: string): FilterKey {
  if (value === 'all' || value === 'unassigned' || value === 'assignee') return value
  return 'mine'
}

type RawCaseRow = {
  id?: string
  title?: string | null
  name?: string | null
  status?: string | null
  due_date?: string | null
  deadline?: string | null
  due_at?: string | null
  limit_date?: string | null
  created_at?: string | null
  property_id?: string | null
  assigned_to?: string | null
}

type CaseRow = {
  id: string
  title: string | null
  status: string | null
  dueDate: string | null
  createdAt: string | null
  propertyId: string | null
  propertyName: string | null
  assignedName: string | null
}

const SORT_OPTIONS = [
  { key: 'due', label: '期限順' },
  { key: 'new', label: '新しい順' },
  { key: 'old', label: '古い順' },
] as const

type SortKey = (typeof SORT_OPTIONS)[number]['key']

function normalizeSort(value?: string): SortKey {
  if (value === 'new' || value === 'old' || value === 'due') {
    return value
  }

  return 'due'
}

function sortCases(rows: CaseRow[], sort: SortKey) {
  const items = [...rows]

  if (sort === 'new') {
    return items.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  }

  if (sort === 'old') {
    return items.sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''))
  }

  return items.sort((a, b) => {
    if (!a.dueDate && !b.dueDate) {
      return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
    }

    if (!a.dueDate) return 1
    if (!b.dueDate) return -1

    return a.dueDate.localeCompare(b.dueDate)
  })
}

function sortButtonClass(active: boolean) {
  return active
    ? 'inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700'
    : 'inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'
}

function getCardClass(level: DueLevel) {
  switch (level) {
    case 'danger':
      return 'rounded-2xl border border-red-200 bg-red-50 p-4'
    case 'warning':
      return 'rounded-2xl border border-amber-200 bg-amber-50 p-4'
    default:
      return 'rounded-2xl border border-slate-200 bg-slate-50 p-4'
  }
}

function getDueBadgeClass(level: DueLevel) {
  switch (level) {
    case 'danger':
      return 'rounded-full bg-white px-2 py-1 text-red-700'
    case 'warning':
      return 'rounded-full bg-white px-2 py-1 text-amber-700'
    default:
      return 'rounded-full bg-white px-2 py-1 text-slate-600'
  }
}

export default async function CasesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const sort = normalizeSort(params?.sort)
  const filter = normalizeFilter(params?.filter)
  const assigneeIdParam = params?.assigneeId ?? ''

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()
  const currentProfile = await getUserProfile()
  const canViewAll =
    currentProfile?.role === 'admin' || currentProfile?.can_view_all_data === true

  // 全社プロフィール取得（フィルターバー用 + 担当者名解決用）
  const { data: allProfilesData } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .eq('company_id', companyId)
    .order('display_name')

  const allProfiles = (allProfilesData ?? []) as Array<{
    id: string
    display_name: string | null
    email: string | null
  }>

  const profileNameMap = new Map<string, string>(
    allProfiles.map((p) => [p.id, p.display_name || p.email || p.id]),
  )

  // assigneeId は canViewAll かつ同一会社プロフィールに存在する場合のみ有効
  const validAssigneeId =
    canViewAll && filter === 'assignee' && isValidUuid(assigneeIdParam) && profileNameMap.has(assigneeIdParam)
      ? assigneeIdParam
      : ''

  // canViewAll=false は常に mine（URL直打ち含め強制）
  type EffectiveFilter = 'mine' | 'all' | 'unassigned' | 'assignee'
  let effectiveFilter: EffectiveFilter
  if (!canViewAll) {
    effectiveFilter = 'mine'
  } else if (filter === 'all') {
    effectiveFilter = 'all'
  } else if (filter === 'unassigned') {
    effectiveFilter = 'unassigned'
  } else if (filter === 'assignee') {
    effectiveFilter = validAssigneeId ? 'assignee' : 'mine'
  } else {
    effectiveFilter = 'mine'
  }

  // Supabase クエリにフィルター適用
  let query = supabase.from('cases').select('*').eq('company_id', companyId)

  if (effectiveFilter === 'mine') {
    if (currentProfile?.id) {
      query = query.eq('assigned_to', currentProfile.id)
    } else {
      // プロフィール不明時は空結果（安全側のフォールバック）
      query = query.eq('id', '00000000-0000-0000-0000-000000000000')
    }
  } else if (effectiveFilter === 'unassigned') {
    query = query.is('assigned_to', null)
  } else if (effectiveFilter === 'assignee') {
    query = query.eq('assigned_to', validAssigneeId)
  }
  // effectiveFilter === 'all' のみ追加条件なし

  const { data, error } = await query

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-600">案件一覧</p>
          <h1 className="mt-1 text-3xl font-bold text-red-700">案件の取得に失敗しました</h1>
          <p className="mt-4 text-sm text-red-600">{error.message}</p>
        </div>
      </div>
    )
  }

  const rawCases = ((data ?? []) as RawCaseRow[]).filter(
    (item): item is RawCaseRow & { id: string } => typeof item.id === 'string' && item.id.length > 0,
  )

  const propertyIds = Array.from(
    new Set(
      rawCases
        .map((item) => item.property_id)
        .filter((value): value is string => typeof value === 'string' && value.length > 0),
    ),
  )

  const propertyNameMap = new Map<string, string | null>()

  if (propertyIds.length > 0) {
    const { data: propertiesData } = await supabase
      .from('properties')
      .select('id, name')
      .eq('company_id', companyId)
      .in('id', propertyIds)

    for (const property of (propertiesData ?? []) as Array<{ id: string; name: string | null }>) {
      propertyNameMap.set(property.id, property.name)
    }
  }

  const cases: CaseRow[] = sortCases(
    rawCases.map((item) => ({
      id: item.id,
      title: pickCaseTitle(item as Record<string, unknown>),
      status: item.status ?? null,
      dueDate: pickCaseDueDate(item as Record<string, unknown>),
      createdAt: item.created_at ?? null,
      propertyId: item.property_id ?? null,
      propertyName: item.property_id ? (propertyNameMap.get(item.property_id) ?? null) : null,
      assignedName: item.assigned_to ? (profileNameMap.get(item.assigned_to) ?? null) : null,
    })),
    sort,
  )

  const filterBarProfiles = allProfiles.map((p) => ({
    id: p.id,
    displayName: p.display_name || p.email || p.id,
  }))

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">案件・タスク管理</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">案件一覧</h1>
            <p className="mt-2 text-sm text-slate-600">
              担当者・並び順で絞り込みできます。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {SORT_OPTIONS.map((option) => {
              const sp = new URLSearchParams()
              sp.set('sort', option.key)
              sp.set('filter', effectiveFilter)
              if (validAssigneeId) sp.set('assigneeId', validAssigneeId)
              return (
                <Link
                  key={option.key}
                  href={`/cases?${sp.toString()}`}
                  className={sortButtonClass(sort === option.key)}
                >
                  {option.label}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <CaseFilterBar
            basePath="/cases"
            currentFilter={effectiveFilter}
            currentAssigneeId={validAssigneeId}
            currentSort={sort}
            profiles={filterBarProfiles}
            canViewAll={canViewAll}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">案件一覧</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {cases.length}件
          </span>
        </div>

        {cases.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            案件データはまだありません。
          </div>
        ) : (
          <div className="space-y-3">
            {cases.map((item) => {
              const dueLevel = getDueLevel(item.dueDate)

              return (
                <div
                  key={item.id}
                  className={getCardClass(dueLevel)}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-base font-bold text-slate-900">
                        {item.title || '無題案件'}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                          状況: {getStatusLabel(item.status)}
                        </span>
                        <span className={getDueBadgeClass(dueLevel)}>
                          期限: {formatDate(item.dueDate)}
                        </span>
                        <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                          担当者: {item.assignedName || '未設定'}
                        </span>
                        <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                          登録日: {formatDate(item.createdAt)}
                        </span>
                        <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                          物件: {item.propertyName || '未設定'}
                        </span>
                      </div>
                    </div>

                    {item.propertyId ? (
                      <Link
                        href={`/properties/${item.propertyId}/cases/${item.id}`}
                        className="text-sm font-medium text-slate-600 hover:underline"
                      >
                        案件詳細を見る
                      </Link>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
