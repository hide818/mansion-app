import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type ComplaintRow = {
  id: string
  title: string | null
  detail: string | null
  status: string | null
  created_at: string | null
  property_id: string | null
}

type PropertyRow = {
  id: string
  name: string | null
}

export default async function ComplaintTrendsPage() {
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
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          所属会社が設定されていません。profiles.company_id を確認してください。
        </div>
      </div>
    )
  }

  const { data: complaints, error } = await supabase
    .from('complaints')
    .select('id, title, detail, status, created_at, property_id')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('complaint trends page error:', error)

    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          クレーム傾向分析の取得に失敗しました。complaints テーブルを確認してください。
        </div>
      </div>
    )
  }

  const safeComplaints = (complaints ?? []) as ComplaintRow[]
  const propertyIds = Array.from(
    new Set(safeComplaints.map((item) => item.property_id).filter(Boolean))
  ) as string[]

  const { data: properties } =
    propertyIds.length > 0
      ? await supabase.from('properties').select('id, name').in('id', propertyIds)
      : { data: [] as PropertyRow[] }

  const propertyMap = new Map<string, string>()
  ;((properties ?? []) as PropertyRow[]).forEach((item) => {
    propertyMap.set(item.id, item.name ?? '物件名未設定')
  })

  const byPropertyMap = new Map<string, number>()
  const byStatusMap = new Map<string, number>()

  safeComplaints.forEach((item) => {
    const propertyName = item.property_id ? propertyMap.get(item.property_id) ?? '不明物件' : '物件未設定'
    byPropertyMap.set(propertyName, (byPropertyMap.get(propertyName) ?? 0) + 1)

    const status = item.status || '未設定'
    byStatusMap.set(status, (byStatusMap.get(status) ?? 0) + 1)
  })

  const propertyRanking = Array.from(byPropertyMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const statusSummary = Array.from(byStatusMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">クレーム傾向分析</h1>
        <p className="mt-2 text-sm text-gray-600">
          クレーム件数を物件別とステータス別で見える化しています。
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="text-sm text-red-700">総クレーム件数</div>
          <div className="mt-2 text-3xl font-bold text-red-900">{safeComplaints.length}</div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">対象物件数</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{propertyRanking.length}</div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <div className="text-sm text-blue-700">分析内容</div>
          <div className="mt-2 text-sm font-medium text-blue-900">物件別件数 / ステータス別件数</div>
        </div>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800">
            物件別クレーム件数ランキング
          </div>

          {propertyRanking.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-500">クレームデータがありません。</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">順位</th>
                  <th className="px-4 py-3 font-medium">物件名</th>
                  <th className="px-4 py-3 font-medium">件数</th>
                </tr>
              </thead>
              <tbody>
                {propertyRanking.map((item, index) => (
                  <tr key={item.name} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3 text-gray-700">{item.name}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800">
            ステータス別クレーム件数
          </div>

          {statusSummary.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-500">クレームデータがありません。</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">ステータス</th>
                  <th className="px-4 py-3 font-medium">件数</th>
                </tr>
              </thead>
              <tbody>
                {statusSummary.map((item) => (
                  <tr key={item.name} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-700">{item.name}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800">
          最近のクレーム
        </div>

        {safeComplaints.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">クレームはまだありません。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">件名</th>
                  <th className="px-4 py-3 font-medium">物件</th>
                  <th className="px-4 py-3 font-medium">ステータス</th>
                  <th className="px-4 py-3 font-medium">移動</th>
                </tr>
              </thead>
              <tbody>
                {safeComplaints.slice(0, 20).map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-900">{item.title || '無題クレーム'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.property_id ? propertyMap.get(item.property_id) ?? '-' : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.status || '-'}</td>
                    <td className="px-4 py-3">
                      {item.property_id ? (
                        <Link
                          href={`/properties/${item.property_id}`}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-800 hover:bg-gray-50"
                        >
                          物件詳細へ
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