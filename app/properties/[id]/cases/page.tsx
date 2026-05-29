import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type Props = {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    created?: string
  }>
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

function pickDueDate(item: RawCaseRow) {
  return item.due_date ?? item.deadline ?? item.due_at ?? item.limit_date ?? null
}

function pickTitle(item: RawCaseRow) {
  return item.title ?? item.name ?? '無題案件'
}

export default async function PropertyCasesPage({ params, searchParams }: Props) {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const created = resolvedSearchParams?.created === '1'

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const { data: property } = await supabase
    .from('properties')
    .select('id, name')
    .eq('id', id)
    .eq('company_id', companyId)
    .maybeSingle()

  if (!property) {
    return notFound()
  }

  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('property_id', id)
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

  const cases = ((data ?? []) as RawCaseRow[]).filter(
    (item): item is RawCaseRow & { id: string } =>
      typeof item.id === 'string' && item.id.length > 0,
  )

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">案件・タスク管理</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              {property.name || '物件'} の案件一覧
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              この物件に紐づく案件を確認できます。
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
              href={`/properties/${id}/cases/new`}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              案件を追加
            </Link>
          </div>
        </div>
      </section>

      {created ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">保存完了</p>
          <p className="mt-2 text-sm text-emerald-700">
            案件を追加しました。
          </p>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">案件一覧</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {cases.length}件
          </span>
        </div>

        {cases.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            案件はまだありません。
          </div>
        ) : (
          <div className="space-y-3">
            {cases.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-base font-bold text-slate-900">
                      {pickTitle(item)}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        状況: {getStatusLabel(item.status ?? null)}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        期限: {formatDate(pickDueDate(item))}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        登録日: {formatDate(item.created_at ?? null)}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/properties/${id}/cases/${item.id}`}
                    className="text-sm font-medium text-emerald-700 hover:underline"
                  >
                    詳細を見る
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}