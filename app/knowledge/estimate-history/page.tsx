import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type PageProps = {
  searchParams?: Promise<{
    q?: string
  }>
}

type CaseFileRow = {
  id: string
  case_id: string | null
  property_id: string | null
  file_name: string | null
  file_url: string | null
  category: string | null
  note: string | null
  created_at: string | null
}

type CaseRow = {
  id: string
  title: string | null
}

type PropertyRow = {
  id: string
  name: string | null
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

function includesText(base: string | null, keyword: string) {
  if (!base) return false
  return base.toLowerCase().includes(keyword.toLowerCase())
}

export default async function EstimateHistoryPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const keyword = (resolvedSearchParams.q ?? '').trim()

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
        <h1 className="text-2xl font-bold">見積履歴検索</h1>
        <p className="mt-4 text-sm text-red-600">company_id が取得できませんでした。</p>
      </div>
    )
  }

  const { data: files, error } = await supabase
    .from('case_files')
    .select('id, case_id, property_id, file_name, file_url, category, note, created_at')
    .eq('company_id', companyId)
    .eq('category', 'estimate')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">見積履歴検索</h1>
        <p className="mt-4 text-sm text-red-600">{error.message}</p>
      </div>
    )
  }

  const caseIds = Array.from(
    new Set((files ?? []).map((item) => item.case_id).filter(Boolean))
  ) as string[]

  const propertyIds = Array.from(
    new Set((files ?? []).map((item) => item.property_id).filter(Boolean))
  ) as string[]

  const { data: cases } = caseIds.length
    ? await supabase
        .from('cases')
        .select('id, title')
        .eq('company_id', companyId)
        .in('id', caseIds)
    : { data: [] as CaseRow[] }

  const { data: properties } = propertyIds.length
    ? await supabase
        .from('properties')
        .select('id, name')
        .eq('company_id', companyId)
        .in('id', propertyIds)
    : { data: [] as PropertyRow[] }

  const caseMap = new Map<string, string>()
  for (const item of cases ?? []) {
    caseMap.set(item.id, item.title ?? '案件名未設定')
  }

  const propertyMap = new Map<string, string>()
  for (const item of properties ?? []) {
    propertyMap.set(item.id, item.name ?? '物件名未設定')
  }

  const filtered = ((files ?? []) as CaseFileRow[]).filter((item) => {
    if (!keyword) return true

    const caseTitle = item.case_id ? caseMap.get(item.case_id) ?? '' : ''
    const propertyName = item.property_id ? propertyMap.get(item.property_id) ?? '' : ''

    return (
      includesText(item.file_name, keyword) ||
      includesText(item.note, keyword) ||
      includesText(caseTitle, keyword) ||
      includesText(propertyName, keyword)
    )
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">見積履歴検索</h1>
        <p className="mt-2 text-sm text-gray-600">
          見積カテゴリの添付ファイルだけをまとめて検索できます。
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          ダッシュボードへ戻る
        </Link>
        <Link
          href="/knowledge/past-cases"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          過去案件検索へ
        </Link>
      </div>

      <form method="get" className="mb-6 rounded-2xl border bg-white p-4">
        <label htmlFor="q" className="mb-2 block text-sm font-medium text-gray-700">
          キーワード検索
        </label>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            id="q"
            name="q"
            defaultValue={keyword}
            placeholder="物件名、案件名、ファイル名、メモで検索"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-gray-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
          >
            検索
          </button>
        </div>
      </form>

      <div className="mb-6 rounded-2xl border bg-white p-4">
        <p className="text-sm text-gray-500">検索結果</p>
        <p className="mt-2 text-3xl font-bold">{filtered.length}</p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6">
          <p className="text-sm text-gray-700">該当する見積履歴がありません。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const caseTitle = item.case_id ? caseMap.get(item.case_id) ?? '案件名未設定' : '案件不明'
            const propertyName = item.property_id
              ? propertyMap.get(item.property_id) ?? '物件名未設定'
              : '物件不明'

            return (
              <div key={item.id} className="rounded-2xl border bg-white p-5">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    見積
                  </span>
                  <span className="text-xs text-gray-500">{formatDateTime(item.created_at)}</span>
                </div>

                <h2 className="text-lg font-bold text-gray-900">{item.file_name ?? 'ファイル名未設定'}</h2>

                <div className="mt-3 space-y-2 text-sm text-gray-700">
                  <p>物件名: {propertyName}</p>
                  <p>案件名: {caseTitle}</p>
                  <p>メモ: {item.note ?? '-'}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {item.file_url ? (
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
                    >
                      ファイルを開く
                    </a>
                  ) : (
                    <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500">
                      URLなし
                    </span>
                  )}

                  {item.property_id && item.case_id && (
                    <Link
                      href={`/properties/${item.property_id}/cases/${item.case_id}`}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      案件詳細を開く
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}