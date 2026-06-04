import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { getUserProfile } from '@/lib/getUserProfile'

type Props = {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    created?: string
  }>
}

type RawTaskRow = {
  id?: string
  title?: string | null
  status?: string | null
  priority?: string | null
  due_date?: string | null
  created_at?: string | null
  case_id?: string | null
  property_id?: string | null
  assigned_to?: string | null
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

function PropertyNotFound({ id }: { id?: string }) {
  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
        <p className="text-sm font-semibold text-amber-700">物件タスク一覧</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          物件情報を取得できませんでした
        </h1>
        {id && (
          <p className="mt-3 text-sm text-slate-600">
            指定された物件ID：<span className="font-mono font-semibold">{id}</span>
          </p>
        )}
        <p className="mt-2 text-sm text-slate-500">
          この物件が存在しないか、アクセス権限がない可能性があります。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/properties"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            物件一覧へ戻る
          </Link>
          <Link
            href="/tasks"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            全体タスク一覧
          </Link>
        </div>
      </section>
    </div>
  )
}

export default async function PropertyTasksPage({ params, searchParams }: Props) {
  const { id } = await params

  if (!id) {
    return <PropertyNotFound />
  }

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const created = resolvedSearchParams?.created === '1'

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()
  const currentProfile = await getUserProfile()
  const canViewAll =
    currentProfile?.role === 'admin' || currentProfile?.can_view_all_data === true

  const { data: property } = await supabase
    .from('properties')
    .select('id, name')
    .eq('id', id)
    .eq('company_id', companyId)
    .maybeSingle()

  if (!property) {
    return <PropertyNotFound id={id} />
  }

  let tasksQuery = supabase
    .from('tasks')
    .select('id, title, status, priority, due_date, created_at, case_id, property_id, assigned_to')
    .eq('company_id', companyId)
    .eq('property_id', id)
    .neq('status', 'done')
    .order('created_at', { ascending: false })

  if (!canViewAll) {
    if (currentProfile?.id) {
      tasksQuery = tasksQuery.eq('assigned_to', currentProfile.id)
    } else {
      // プロフィール不明時は空結果（安全側のフォールバック）
      tasksQuery = tasksQuery.eq('id', '00000000-0000-0000-0000-000000000000')
    }
  }

  const { data: tasksData, error: tasksError } = await tasksQuery

  if (tasksError) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-600">物件タスク一覧</p>
          <h1 className="mt-1 text-3xl font-bold text-red-700">タスクの取得に失敗しました</h1>
          <p className="mt-4 text-sm text-red-600">{tasksError.message}</p>
        </div>
      </div>
    )
  }

  const rawTasks = ((tasksData ?? []) as RawTaskRow[]).filter(
    (item): item is RawTaskRow & { id: string } =>
      typeof item.id === 'string' && item.id.length > 0,
  )

  const caseIds = Array.from(
    new Set(
      rawTasks
        .map((item) => item.case_id)
        .filter((value): value is string => typeof value === 'string' && value.length > 0),
    ),
  )

  const caseTitleMap = new Map<string, string | null>()

  if (caseIds.length > 0) {
    const { data: casesData } = await supabase
      .from('cases')
      .select('id, title, name')
      .eq('company_id', companyId)
      .in('id', caseIds)

    const cases = (casesData ?? []) as Array<{
      id: string
      title?: string | null
      name?: string | null
    }>

    for (const item of cases) {
      caseTitleMap.set(item.id, item.title ?? item.name ?? null)
    }
  }

  const assignedToIds = Array.from(
    new Set(
      rawTasks
        .map((item) => item.assigned_to)
        .filter((v): v is string => typeof v === 'string' && v.length > 0),
    ),
  )
  const assigneeNameMap = new Map<string, string>()
  if (assignedToIds.length > 0) {
    const { data: assigneeProfiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', assignedToIds)
      .eq('company_id', companyId)
    ;((assigneeProfiles ?? []) as Array<{ id: string; display_name: string | null }>).forEach(
      (p) => { assigneeNameMap.set(p.id, p.display_name ?? '名前未設定') },
    )
  }

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">案件・タスク管理</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              {property.name || '物件'} のタスク一覧
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              この物件のタスクを確認できます。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/properties/${id}`}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              物件へ戻る
            </Link>

            <Link
              href={`/properties/${id}/tasks/new`}
              className="inline-flex min-w-[64px] items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium !text-white hover:bg-slate-800"
            >
              物件タスクを追加
            </Link>
          </div>
        </div>
      </section>

      {created ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">追加完了</p>
          <p className="mt-2 text-sm text-emerald-700">
            この物件にタスクを追加しました。
          </p>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">物件タスク一覧</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {rawTasks.length}件
          </span>
        </div>

        {rawTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            この物件のタスクはまだありません。
          </div>
        ) : (
          <div className="space-y-3">
            {rawTasks.map((item) => (
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
                        状況: {getStatusLabel(item.status ?? null)}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        優先度: {getPriorityLabel(item.priority ?? null)}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        期限: {formatDate(item.due_date ?? null)}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        案件: {item.case_id ? (caseTitleMap.get(item.case_id) ?? '未設定') : '物件直下'}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        担当者: {item.assigned_to ? (assigneeNameMap.get(item.assigned_to) ?? '未設定') : '未設定'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/properties/${id}/tasks/${item.id}`}
                      className="text-sm font-medium text-emerald-700 hover:underline"
                    >
                      タスク詳細を見る
                    </Link>

                    {item.case_id ? (
                      <Link
                        href={`/properties/${id}/cases/${item.case_id}`}
                        className="text-sm font-medium text-emerald-700 hover:underline"
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