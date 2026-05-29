import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type SearchParams = Promise<{
  q?: string
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

function scoreTitle(title: string | null, query: string) {
  if (!title || !query) return 0

  const normalizedTitle = title.toLowerCase()
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)

  let score = 0

  keywords.forEach((keyword) => {
    if (normalizedTitle.includes(keyword)) {
      score += 1
    }
  })

  return score
}

export default async function SimilarCasesPage({
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

  const { data: cases, error } = await supabase
    .from('cases')
    .select('id, title, property_id, status, assignee, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('similar cases page error:', error)

    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          類似案件レコメンドの取得に失敗しました。cases テーブルを確認してください。
        </div>
      </div>
    )
  }

  const safeCases = (cases ?? []) as CaseRow[]

  const filteredCases = query
    ? safeCases
        .map((item) => ({
          ...item,
          matchScore: scoreTitle(item.title, query),
        }))
        .filter((item) => item.matchScore > 0)
        .sort((a, b) => {
          if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore
          return (b.created_at ?? '').localeCompare(a.created_at ?? '')
        })
        .slice(0, 20)
    : []

  const propertyIds = Array.from(
    new Set(filteredCases.map((item) => item.property_id).filter(Boolean))
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
        <h1 className="text-2xl font-bold text-gray-900">類似案件レコメンド</h1>
        <p className="mt-2 text-sm text-gray-600">
          入力したキーワードと案件名の一致度をもとに、類似案件候補を表示します。
        </p>
      </div>

      <form method="get" className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">探したい案件キーワード</label>
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="例：漏水、消防、駐車場トラブル"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              類似案件を探す
            </button>
          </div>
        </div>
      </form>

      {!query ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
          まずキーワードを入れて検索してください。
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-gray-500">検索キーワード</div>
              <div className="mt-2 text-lg font-semibold text-gray-900">{query}</div>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
              <div className="text-sm text-blue-700">候補件数</div>
              <div className="mt-2 text-3xl font-bold text-blue-900">{filteredCases.length}</div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-gray-500">判定基準</div>
              <div className="mt-2 text-sm font-medium text-gray-900">案件名のキーワード一致</div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800">
              類似案件候補
            </div>

            {filteredCases.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-500">一致する案件は見つかりませんでした。</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">案件名</th>
                      <th className="px-4 py-3 font-medium">一致度</th>
                      <th className="px-4 py-3 font-medium">物件</th>
                      <th className="px-4 py-3 font-medium">ステータス</th>
                      <th className="px-4 py-3 font-medium">作成日</th>
                      <th className="px-4 py-3 font-medium">移動</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map((item) => (
                      <tr key={item.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-gray-900">{item.title || '無題案件'}</td>
                        <td className="px-4 py-3 text-gray-700">{item.matchScore}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {item.property_id ? propertyMap.get(item.property_id) ?? '-' : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{item.status || '-'}</td>
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
        </>
      )}
    </div>
  )
}