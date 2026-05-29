import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type ComplaintRow = {
  id: string
  property_id: string | null
  status: string | null
}

type PropertyRow = {
  id: string
  name: string | null
}

type RankingRow = {
  propertyId: string
  propertyName: string
  total: number
  open: number
  completed: number
}

export default async function ComplaintRankingPage() {
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
        <h1 className="text-2xl font-bold">クレーム発生ランキング</h1>
        <p className="mt-4 text-sm text-red-600">company_id が取得できませんでした。</p>
      </div>
    )
  }

  const { data: complaints, error } = await supabase
    .from('complaints')
    .select('id, property_id, status')
    .eq('company_id', companyId)

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">クレーム発生ランキング</h1>
        <p className="mt-4 text-sm text-red-600">{error.message}</p>
      </div>
    )
  }

  const propertyIds = Array.from(
    new Set((complaints ?? []).map((item) => item.property_id).filter(Boolean))
  ) as string[]

  const { data: properties } = propertyIds.length
    ? await supabase
        .from('properties')
        .select('id, name')
        .eq('company_id', companyId)
        .in('id', propertyIds)
    : { data: [] as PropertyRow[] }

  const propertyMap = new Map<string, string>()
  for (const item of properties ?? []) {
    propertyMap.set(item.id, item.name ?? '物件名未設定')
  }

  const rankingMap = new Map<string, RankingRow>()

  for (const item of (complaints ?? []) as ComplaintRow[]) {
    if (!item.property_id) continue

    if (!rankingMap.has(item.property_id)) {
      rankingMap.set(item.property_id, {
        propertyId: item.property_id,
        propertyName: propertyMap.get(item.property_id) ?? '物件名未設定',
        total: 0,
        open: 0,
        completed: 0,
      })
    }

    const row = rankingMap.get(item.property_id)
    if (!row) continue

    row.total += 1

    if (item.status === '完了') {
      row.completed += 1
    } else {
      row.open += 1
    }
  }

  const rows = Array.from(rankingMap.values()).sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total
    return b.open - a.open
  })

  const totalComplaints = rows.reduce((sum, row) => sum + row.total, 0)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">クレーム発生ランキング</h1>
        <p className="mt-2 text-sm text-gray-600">
          物件ごとのクレーム件数を多い順に並べています。
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/complaints"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          クレーム一覧へ戻る
        </Link>
        <Link
          href="/analytics/complaint-trends"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          クレーム傾向分析へ
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">対象物件数</p>
          <p className="mt-2 text-3xl font-bold">{rows.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">総クレーム件数</p>
          <p className="mt-2 text-3xl font-bold">{totalComplaints}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">最多物件</p>
          <p className="mt-2 text-sm font-medium">{rows[0]?.propertyName ?? '-'}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6">
          <p className="text-sm text-gray-700">クレームデータがありません。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row, index) => (
            <div key={row.propertyId} className="rounded-2xl border bg-white p-5">
              <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs text-gray-500">第{index + 1}位</p>
                  <h2 className="text-lg font-bold">{row.propertyName}</h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                    総数 {row.total}件
                  </span>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    未完了 {row.open}件
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    完了 {row.completed}件
                  </span>
                </div>
              </div>

              <Link
                href={`/properties/${row.propertyId}`}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                物件詳細を開く
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}