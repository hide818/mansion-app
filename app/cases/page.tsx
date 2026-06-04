import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
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
}>

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
    ? 'inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700'
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

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('company_id', companyId)

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

    const properties = (propertiesData ?? []) as Array<{
      id: string
      name: string | null
    }>

    for (const property of properties) {
      propertyNameMap.set(property.id, property.name)
    }
  }

  const assignedToIds = Array.from(
    new Set(
      rawCases
        .map((item) => item.assigned_to)
        .filter((v): v is string => typeof v === 'string' && v.length > 0),
    ),
  )

  const assigneeNameMap = new Map<string, string>()

  if (assignedToIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .eq('company_id', companyId)
      .in('id', assignedToIds)

    for (const p of (profilesData ?? []) as Array<{ id: string; display_name: string | null; email: string | null }>) {
      assigneeNameMap.set(p.id, p.display_name || p.email || p.id)
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
      assignedName: item.assigned_to ? (assigneeNameMap.get(item.assigned_to) ?? null) : null,
    })),
    sort,
  )

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">案件・タスク管理</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">案件一覧</h1>
            <p className="mt-2 text-sm text-slate-600">
              期限順・新しい順・古い順で並び替えできます。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {SORT_OPTIONS.map((option) => (
              <Link
                key={option.key}
                href={`/cases?sort=${option.key}`}
                className={sortButtonClass(sort === option.key)}
              >
                {option.label}
              </Link>
            ))}
          </div>
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
