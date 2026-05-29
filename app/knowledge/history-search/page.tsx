import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type SearchParams = Promise<{
  q?: string
}>

type LogRow = {
  id: string
  case_id: string | null
  message: string | null
  created_at: string | null
  type: string | null
}

type CaseRow = {
  id: string
  title: string | null
  property_id: string | null
}

type PropertyRow = {
  id: string
  name: string | null
}

function formatDateTime(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default async function HistorySearchPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createSupabaseServerClient()
  const resolvedSearchParams = await searchParams
  const query = (resolvedSearchParams.q ?? '').trim()

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
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          所属会社が設定されていません。profiles.company_id を確認してください。
        </div>
      </div>
    )
  }

  let logsQuery = supabase
    .from('logs')
    .select('id, case_id, message, created_at, type')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (query) {
    logsQuery = logsQuery.ilike('message', `%${query}%`)
  }

  const { data: logs, error } = await logsQuery

  if (error) {
    console.error('history search page error:', error)

    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          対応履歴検索の取得に失敗しました。logs テーブルを確認してください。
        </div>
      </div>
    )
  }

  const safeLogs = (logs ?? []) as LogRow[]
  const caseIds = Array.from(new Set(safeLogs.map((item) => item.case_id).filter(Boolean))) as string[]

  const { data: cases } =
    caseIds.length > 0
      ? await supabase.from('cases').select('id, title, property_id').in('id', caseIds)
      : { data: [] as CaseRow[] }

  const safeCases = (cases ?? []) as CaseRow[]
  const propertyIds = Array.from(new Set(safeCases.map((item) => item.property_id).filter(Boolean))) as string[]

  const { data: properties } =
    propertyIds.length > 0
      ? await supabase.from('properties').select('id, name').in('id', propertyIds)
      : { data: [] as PropertyRow[] }

  const caseMap = new Map<string, CaseRow>()
  safeCases.forEach((item) => {
    caseMap.set(item.id, item)
  })

  const propertyMap = new Map<string, string>()
  ;((properties ?? []) as PropertyRow[]).forEach((item) => {
    propertyMap.set(item.id, item.name ?? '物件名未設定')
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">対応履歴検索</h1>
        <p className="mt-2 text-sm text-gray-600">
          ログ本文から、過去の対応履歴を検索できます。
        </p>
      </div>

      <form method="get" className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">ログ本文検索</label>
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="例：電話、理事長、見積、現地確認"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              検索する
            </button>
          </div>
        </div>
      </form>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">検索結果</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{safeLogs.length}</div>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <div className="text-sm text-blue-700">検索語</div>
          <div className="mt-2 text-sm text-blue-900">{query || '未入力'}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">表示件数上限</div>
          <div className="mt-2 text-sm font-medium text-gray-900">100件</div>
        </div>
      </div>

      <div className="grid gap-4">
        {safeLogs.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
            該当する対応履歴はありません。
          </div>
        ) : (
          safeLogs.map((item) => {
            const relatedCase = item.case_id ? caseMap.get(item.case_id) ?? null : null
            const propertyName =
              relatedCase?.property_id ? propertyMap.get(relatedCase.property_id) ?? '-' : '-'

            return (
              <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-sm text-gray-500">{formatDateTime(item.created_at)}</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">
                      {relatedCase?.title || '案件未紐づきログ'}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      物件: {propertyName} / type: {item.type || '-'}
                    </div>
                  </div>

                  <div>
                    {relatedCase?.property_id && relatedCase.id ? (
                      <Link
                        href={`/properties/${relatedCase.property_id}/cases/${relatedCase.id}`}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                      >
                        案件詳細へ
                      </Link>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm leading-7 text-gray-800">
                  {item.message || '本文なし'}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}