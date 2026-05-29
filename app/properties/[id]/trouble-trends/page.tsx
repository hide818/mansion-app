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

type ComplaintRow = {
  id: string
  title: string | null
  detail: string | null
  status: string | null
  created_at: string | null
}

function formatDate(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export default async function PropertyTroubleTrendsPage({ params }: PageProps) {
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
        <h1 className="text-2xl font-bold">過去トラブル傾向</h1>
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

  const { data: complaints, error } = await supabase
    .from('complaints')
    .select('id, title, detail, status, created_at')
    .eq('company_id', companyId)
    .eq('property_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">過去トラブル傾向</h1>
        <p className="mt-4 text-sm text-red-600">{error.message}</p>
      </div>
    )
  }

  const titleCountMap = new Map<string, number>()
  for (const item of complaints ?? []) {
    const key = (item.title ?? '件名未設定').trim()
    titleCountMap.set(key, (titleCountMap.get(key) ?? 0) + 1)
  }

  const repeatedTitles = Array.from(titleCountMap.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])

  const unresolved = (complaints ?? []).filter((item) => item.status !== '完了')
  const latestFive = (complaints ?? []).slice(0, 5)

  let summary = '大きな再発傾向はまだ強く出ていません。'
  if (repeatedTitles.length >= 1) {
    summary = '同じ件名のクレームが複数回出ているため、再発傾向があります。'
  } else if (unresolved.length >= 2) {
    summary = '未完了クレームが複数あるため、住民対応の詰まりに注意が必要です。'
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-sm text-gray-500">{property.name ?? '物件名未設定'}</p>
        <h1 className="mt-1 text-2xl font-bold">過去トラブル傾向</h1>
        <p className="mt-2 text-sm text-gray-600">
          この物件で過去に起きたクレームの流れから、再発しやすいテーマを見ます。
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
          href={`/properties/${id}/complaints-history`}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          クレーム履歴を見る
        </Link>
      </div>

      <div className="mb-6 rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-bold">傾向サマリー</h2>
        <p className="mt-3 text-sm leading-7 text-gray-700">{summary}</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">総クレーム件数</p>
          <p className="mt-2 text-3xl font-bold">{complaints?.length ?? 0}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">未完了件数</p>
          <p className="mt-2 text-3xl font-bold">{unresolved.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">再発テーマ数</p>
          <p className="mt-2 text-3xl font-bold">{repeatedTitles.length}</p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-bold">再発しやすい件名</h2>

        {repeatedTitles.length === 0 ? (
          <p className="mt-4 text-sm text-gray-700">同じ件名で2回以上出ているものはありません。</p>
        ) : (
          <div className="mt-4 space-y-3">
            {repeatedTitles.map(([title, count]) => (
              <div key={title} className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="mt-1 text-sm text-gray-600">{count}回発生</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-bold">直近のクレーム</h2>

        {latestFive.length === 0 ? (
          <p className="mt-4 text-sm text-gray-700">クレームはまだありません。</p>
        ) : (
          <div className="mt-4 space-y-4">
            {latestFive.map((item) => (
              <div key={item.id} className="rounded-xl bg-gray-50 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-semibold text-gray-900">{item.title ?? '件名未設定'}</p>
                  <span className="text-xs text-gray-500">{formatDate(item.created_at)}</span>
                </div>
                <p className="mt-2 text-sm text-gray-700">状態: {item.status ?? '未設定'}</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-gray-700">
                  {item.detail ?? '詳細なし'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}