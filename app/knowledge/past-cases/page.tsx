import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type SearchParams = Promise<{
  q?: string
  status?: string
}>

type CaseRow = {
  id: string
  title: string | null
  property_id: string | null
  status: string | null
  assignee: string | null
  created_at: string | null
}

type PropertyRow = {
  id: string
  name: string | null
}

function formatDate(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export default async function PastCasesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createSupabaseServerClient()
  const resolvedSearchParams = await searchParams

  const query = (resolvedSearchParams.q ?? '').trim()
  const status = (resolvedSearchParams.status ?? '').trim()

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

  let casesQuery = supabase
    .from('cases')
    .select('id, title, property_id, status, assignee, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (query) {
    casesQuery = casesQuery.ilike('title', `%${query}%`)
  }

  if (status) {
    casesQuery = casesQuery.eq('status', status)
  }

  const { data: cases, error } = await casesQuery

  if (error) {
    console.error('past cases page error:', error)

    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          過去案件検索の取得に失敗しました。cases テーブルを確認してください。
        </div>
      </div>
    )
  }

  const safeCases = (cases ?? []) as CaseRow[]
  const propertyIds = Array.from(
    new Set(safeCases.map((item) => item.property_id).filter(Boolean))
  ) as string[]

  const { data: properties } =
    propertyIds.length > 0
      ? await supabase.from('properties').select('id, name').in('id', propertyIds)
      : { data: [] as PropertyRow[] }

  const propertyMap = new Map<string, string>()
  ;((properties ?? []) as PropertyRow[]).forEach((item) => {
    propertyMap.set(item.id, item.name ?? '物件名未設定')
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">過去案件検索</h1>
        <p className="mt-2 text-sm text-gray-600">
          案件名とステータスで、自社の過去案件を検索できます。
        </p>
      </div>

      <form method="get" className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">案件名検索</label>
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="例：漏水、消防、駐車場"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ステータス</label>
            <select
              name="status"
              defaultValue={status}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800"
            >
              <option value="">すべて</option>
              <option value="進行中">進行中</option>
              <option value="保留">保留</option>
              <option value="完了">完了</option>
            </select>
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
          <div className="mt-2 text-3xl font-bold text-gray-900">{safeCases.length}</div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <div className="text-sm text-blue-700">検索条件</div>
          <div className="mt-2 text-sm text-blue-900">
            {query || status ? `案件名:${query || 'なし'} / ステータス:${status || 'すべて'}` : '条件なし'}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">表示件数上限</div>
          <div className="mt-2 text-sm font-medium text-gray-900">100件</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800">
          検索結果
        </div>

        {safeCases.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">該当する案件はありません。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">案件名</th>
                  <th className="px-4 py-3 font-medium">物件</th>
                  <th className="px-4 py-3 font-medium">ステータス</th>
                  <th className="px-4 py-3 font-medium">担当者</th>
                  <th className="px-4 py-3 font-medium">作成日</th>
                  <th className="px-4 py-3 font-medium">移動</th>
                </tr>
              </thead>
              <tbody>
                {safeCases.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-900">{item.title || '無題案件'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.property_id ? propertyMap.get(item.property_id) ?? '-' : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.status || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{item.assignee || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-3">
                      {item.property_id ? (
                        <Link
                          href={`/properties/${item.property_id}/cases/${item.id}`}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-800 hover:bg-gray-50"
                        >
                          案件詳細へ
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">移動先なし</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}