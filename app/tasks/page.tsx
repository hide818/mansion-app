import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { getUserProfile } from '@/lib/getUserProfile'
import { isValidUuid } from '@/lib/isValidUuid'
import CaseFilterBar from '@/app/components/CaseFilterBar'

type SearchParams = Promise<{
  sort?: string
  filter?: string
  assigneeId?: string
  statusFilter?: string
}>

type TaskRow = {
  id: string
  title: string | null
  status: string | null
  priority: string | null
  due_date: string | null
  created_at: string | null
  property_id: string | null
  case_id: string | null
  property_name: string | null
  case_title: string | null
  assigned_to: string | null
}

const SORT_OPTIONS = [
  { key: 'due', label: '期限順' },
  { key: 'new', label: '新しい順' },
  { key: 'old', label: '古い順' },
] as const

type SortKey = (typeof SORT_OPTIONS)[number]['key']

const STATUS_FILTER_OPTIONS = [
  { key: 'active', label: '未完了' },
  { key: 'done', label: '完了済み' },
  { key: 'all', label: 'すべて' },
] as const

type StatusFilterKey = (typeof STATUS_FILTER_OPTIONS)[number]['key']

function normalizeStatusFilter(value?: string): StatusFilterKey {
  if (value === 'done' || value === 'all') return value
  return 'active'
}

type FilterKey = 'mine' | 'all' | 'unassigned' | 'assignee'

function normalizeFilter(value?: string): FilterKey {
  if (value === 'all' || value === 'unassigned' || value === 'assignee') return value
  return 'mine'
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

function getPriorityLabel(priority: string | null) {
  if (!priority) return '未設定'

  switch (priority) {
    case 'high':
      return '高'
    case 'medium':
      return '中'
    case 'low':
      return '低'
    default:
      return priority
  }
}

function normalizeSort(value?: string): SortKey {
  if (value === 'new' || value === 'old' || value === 'due') {
    return value
  }

  return 'due'
}

function sortTasks(rows: TaskRow[], sort: SortKey) {
  const items = [...rows]

  if (sort === 'new') {
    return items.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
  }

  if (sort === 'old') {
    return items.sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))
  }

  return items.sort((a, b) => {
    if (!a.due_date && !b.due_date) {
      return (b.created_at ?? '').localeCompare(a.created_at ?? '')
    }

    if (!a.due_date) return 1
    if (!b.due_date) return -1

    return a.due_date.localeCompare(b.due_date)
  })
}

function sortButtonClass(active: boolean) {
  return active
    ? 'inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700'
    : 'inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const sort = normalizeSort(params?.sort)
  const filter = normalizeFilter(params?.filter)
  const assigneeIdParam = params?.assigneeId ?? ''
  const statusFilter = normalizeStatusFilter(params?.statusFilter)

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()
  const currentProfile = await getUserProfile()
  const canViewAll =
    currentProfile?.role === 'admin' || currentProfile?.can_view_all_data === true

  // 全社プロフィール取得（フィルターバー用 + 担当者名解決用）
  const { data: allProfilesData } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('company_id', companyId)
    .order('display_name')

  const allProfiles = (allProfilesData ?? []) as Array<{
    id: string
    display_name: string | null
  }>

  const profileNameMap = new Map<string, string>(
    allProfiles.map((p) => [p.id, p.display_name || p.id]),
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

  let taskQuery = supabase
    .from('tasks')
    .select('id, title, status, priority, due_date, created_at, property_id, case_id, assigned_to')
    .eq('company_id', companyId)

  if (statusFilter === 'active') {
    taskQuery = taskQuery.neq('status', 'done')
  } else if (statusFilter === 'done') {
    taskQuery = taskQuery.eq('status', 'done')
  }
  // statusFilter === 'all': ステータス条件なし

  if (effectiveFilter === 'mine') {
    if (currentProfile?.id) {
      taskQuery = taskQuery.eq('assigned_to', currentProfile.id)
    } else {
      // プロフィール不明時は空結果（安全側のフォールバック）
      taskQuery = taskQuery.eq('id', '00000000-0000-0000-0000-000000000000')
    }
  } else if (effectiveFilter === 'unassigned') {
    taskQuery = taskQuery.is('assigned_to', null)
  } else if (effectiveFilter === 'assignee') {
    taskQuery = taskQuery.eq('assigned_to', validAssigneeId)
  }
  // effectiveFilter === 'all' のみ追加条件なし

  const { data, error } = await taskQuery

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-600">タスク一覧</p>
          <h1 className="mt-1 text-3xl font-bold text-red-700">タスクの取得に失敗しました</h1>
          <p className="mt-4 text-sm text-red-600">{error.message}</p>
        </div>
      </div>
    )
  }

  const rawTasks = (data ?? []) as Array<{
    id: string
    title: string | null
    status: string | null
    priority: string | null
    due_date: string | null
    created_at: string | null
    property_id: string | null
    case_id: string | null
    assigned_to: string | null
  }>

  const propertyIds = Array.from(
    new Set(
      rawTasks
        .map((item) => item.property_id)
        .filter((value): value is string => typeof value === 'string' && value.length > 0),
    ),
  )

  const caseIds = Array.from(
    new Set(
      rawTasks
        .map((item) => item.case_id)
        .filter((value): value is string => typeof value === 'string' && value.length > 0),
    ),
  )

  const propertyNameMap = new Map<string, string | null>()
  const caseTitleMap = new Map<string, string | null>()
  const casePropertyMap = new Map<string, string | null>()

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

  if (caseIds.length > 0) {
    const { data: casesData } = await supabase
      .from('cases')
      .select('*')
      .eq('company_id', companyId)
      .in('id', caseIds)

    const cases = (casesData ?? []) as Array<{
      id: string
      title?: string | null
      name?: string | null
      property_id?: string | null
    }>

    for (const item of cases) {
      caseTitleMap.set(item.id, item.title ?? item.name ?? null)
      casePropertyMap.set(item.id, item.property_id ?? null)
    }
  }

  const tasks: TaskRow[] = sortTasks(
    rawTasks.map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      priority: item.priority,
      due_date: item.due_date,
      created_at: item.created_at,
      property_id: item.property_id,
      case_id: item.case_id,
      property_name: item.property_id ? (propertyNameMap.get(item.property_id) ?? null) : null,
      case_title: item.case_id ? (caseTitleMap.get(item.case_id) ?? null) : null,
      assigned_to: item.assigned_to,
    })),
    sort,
  )

  const filterBarProfiles = allProfiles.map((p) => ({
    id: p.id,
    displayName: p.display_name || p.id,
  }))

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">案件・タスク管理</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">タスク一覧</h1>
            <p className="mt-2 text-sm text-slate-600">
              担当者・ステータス・並び順で絞り込みできます。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {SORT_OPTIONS.map((option) => {
              const sp = new URLSearchParams()
              sp.set('sort', option.key)
              sp.set('filter', effectiveFilter)
              if (validAssigneeId) sp.set('assigneeId', validAssigneeId)
              sp.set('statusFilter', statusFilter)
              return (
                <Link
                  key={option.key}
                  href={`/tasks?${sp.toString()}`}
                  className={sortButtonClass(sort === option.key)}
                >
                  {option.label}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
          <CaseFilterBar
            basePath="/tasks"
            currentFilter={effectiveFilter}
            currentAssigneeId={validAssigneeId}
            currentSort={sort}
            profiles={filterBarProfiles}
            extraParams={{ statusFilter }}
            canViewAll={canViewAll}
          />

          <div className="flex flex-wrap gap-3">
            {STATUS_FILTER_OPTIONS.map((option) => {
              const sp = new URLSearchParams()
              sp.set('statusFilter', option.key)
              sp.set('sort', sort)
              sp.set('filter', effectiveFilter)
              if (validAssigneeId) sp.set('assigneeId', validAssigneeId)
              return (
                <Link
                  key={option.key}
                  href={`/tasks?${sp.toString()}`}
                  className={sortButtonClass(statusFilter === option.key)}
                >
                  {option.label}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">タスク一覧</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {tasks.length}件
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            タスクデータはまだありません。
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-base font-bold text-slate-900">
                      {item.title || '無題タスク'}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        状況: {getStatusLabel(item.status)}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        優先度: {getPriorityLabel(item.priority)}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        期限: {formatDate(item.due_date)}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        登録日: {formatDate(item.created_at)}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        物件: {item.property_name || '未設定'}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        案件: {item.case_title || '物件直下'}
                      </span>
                      {canViewAll ? (
                        <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                          担当者: {item.assigned_to ? (profileNameMap.get(item.assigned_to) ?? '未設定') : '未設定'}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-1">
                    {item.property_id && propertyNameMap.has(item.property_id) ? (
                      <Link
                        href={`/properties/${item.property_id}/tasks/${item.id}`}
                        className="text-sm font-medium text-slate-600 hover:underline"
                      >
                        タスク詳細を見る
                      </Link>
                    ) : null}

                    {item.property_id && propertyNameMap.has(item.property_id) && item.case_id ? (
                      <Link
                        href={`/properties/${item.property_id}/cases/${item.case_id}`}
                        className="text-sm font-medium text-slate-600 hover:underline"
                      >
                        案件詳細を見る
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}