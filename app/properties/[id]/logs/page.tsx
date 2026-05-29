import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

type PropertyRow = {
  id: string
  name: string | null
}

type CaseRow = {
  id: string
  title: string | null
  status: string | null
}

type LogRow = {
  id: string
  case_id: string | null
  message: string | null
  created_at: string | null
  type: string | null
}

function formatDateTime(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default async function PropertyLogsPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const companyId = await getUserCompanyId()

  if (!companyId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">物件ログ一覧</h1>
        <p className="mt-4 text-sm text-red-600">company_id が取得できませんでした。</p>
      </div>
    )
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('id', id)
    .maybeSingle<PropertyRow>()

  if (propertyError || !property) {
    notFound()
  }

  const { data: cases, error: casesError } = await supabase
    .from('cases')
    .select('id, title, status')
    .eq('property_id', id)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (casesError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">物件ログ一覧</h1>
        <p className="mt-4 text-sm text-red-600">{casesError.message}</p>
      </div>
    )
  }

  const caseIds = (cases ?? []).map((item) => item.id)

  const { data: logs, error: logsError } = caseIds.length
    ? await supabase
        .from('logs')
        .select('id, case_id, message, created_at, type')
        .eq('company_id', companyId)
        .in('case_id', caseIds)
        .order('created_at', { ascending: false })
    : { data: [] as LogRow[], error: null }

  if (logsError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">物件ログ一覧</h1>
        <p className="mt-4 text-sm text-red-600">{logsError.message}</p>
      </div>
    )
  }

  const caseMap = new Map<string, CaseRow>()
  for (const item of cases ?? []) {
    caseMap.set(item.id, item)
  }

  const typeLabelMap = new Map<string, string>([
    ['comment', 'コメント'],
    ['manual', '手動'],
    ['status', 'ステータス'],
    ['system', 'システム'],
  ])

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-sm text-gray-500">{property.name ?? '物件名未設定'}</p>
        <h1 className="mt-1 text-2xl font-bold">物件ログ一覧</h1>
        <p className="mt-2 text-sm text-gray-600">
          この物件の案件に紐づくログを、新しい順にまとめて表示します。
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}`}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          物件詳細へ戻る
        </Link>
        <Link
          href="/logs"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          全ログ一覧へ
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">案件数</p>
          <p className="mt-2 text-3xl font-bold">{cases?.length ?? 0}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">ログ件数</p>
          <p className="mt-2 text-3xl font-bold">{logs?.length ?? 0}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">最新ログ日時</p>
          <p className="mt-2 text-sm font-medium">{formatDateTime(logs?.[0]?.created_at ?? null)}</p>
        </div>
      </div>

      {!logs || logs.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6">
          <p className="text-sm text-gray-700">この物件にはまだログがありません。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => {
            const caseInfo = log.case_id ? caseMap.get(log.case_id) : null

            return (
              <div key={log.id} className="rounded-2xl border bg-white p-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {typeLabelMap.get(log.type ?? '') ?? (log.type ?? '未設定')}
                  </span>
                  <span className="text-xs text-gray-500">{formatDateTime(log.created_at)}</span>
                </div>

                <p className="mb-3 whitespace-pre-wrap break-words text-sm leading-7 text-gray-800">
                  {log.message ?? '本文なし'}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <span>案件名: {caseInfo?.title ?? '案件不明'}</span>
                  <span>案件状態: {caseInfo?.status ?? '-'}</span>
                </div>

                {log.case_id && (
                  <div className="mt-4">
                    <Link
                      href={`/properties/${id}/cases/${log.case_id}`}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      この案件を開く
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}