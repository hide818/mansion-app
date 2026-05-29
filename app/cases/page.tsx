import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

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
}

type CaseRow = {
  id: string
  title: string | null
  status: string | null
  dueDate: string | null
  createdAt: string | null
  propertyId: string | null
  propertyName: string | null
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

function formatDate(value: string | null) {
  if (!value) return '未設定'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function getStatusLabel(status: string | null) {
  if (!status) return '未設定'

  switch (status) {
    case 'todo':
      return '未着手'
    case 'doing':
      return '進行中'
    case 'done':
      return '完了'
    case 'pending':
      return '保留'
    default:
      return status
  }
}

function pickCaseTitle(item: RawCaseRow) {
  return item.title ?? item.name ?? '無題案件'
}

function pickCaseDueDate(item: RawCaseRow) {
  return item.due_date ?? item.deadline ?? item.due_at ?? item.limit_date ?? null
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
    ? 'rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white'
    : 'rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50'
}

function getDueLevel(value: string | null): 'danger' | 'warning' | 'normal' | 'none' {
  if (!value) return 'none'

  const due = new Date(value)
  if (Number.isNaN(due.getTime())) return 'none'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  due.setHours(0, 0, 0, 0)

  if (due.getTime() <= today.getTime()) {
    return 'danger'
  }

  if (due.getTime() === tomorrow.getTime()) {
    return 'warning'
  }

  return 'normal'
}

function getCardClass(level: 'danger' | 'warning' | 'normal' | 'none') {
  switch (level) {
    case 'danger':
      return 'rounded-2xl border border-red-200 bg-red-50 p-4'
    case 'warning':
      return 'rounded-2xl border border-amber-200 bg-amber-50 p-4'
    default:
      return 'rounded-2xl border border-slate-200 bg-slate-50 p-4'
  }
}

function getDueBadgeClass(level: 'danger' | 'warning' | 'normal' | 'none') {
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

  const cases: CaseRow[] = sortCases(
    rawCases.map((item) => ({
      id: item.id,
      title: pickCaseTitle(item),
      status: item.status ?? null,
      dueDate: pickCaseDueDate(item),
      createdAt: item.created_at ?? null,
      propertyId: item.property_id ?? null,
      propertyName: item.property_id ? (propertyNameMap.get(item.property_id) ?? null) : null,
    })),
    sort,
  )

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">案件・タスク管理</p>
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
                        className="text-sm font-medium text-emerald-700 hover:underline"
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