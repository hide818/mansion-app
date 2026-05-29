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

function getStatusClass(status: string | null) {
  if (status === '完了') return 'bg-emerald-50 text-emerald-700'
  if (status === '対応中') return 'bg-amber-50 text-amber-700'
  return 'bg-gray-100 text-gray-700'
}

export default async function PropertyComplaintsHistoryPage({ params }: PageProps) {
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
        <h1 className="text-2xl font-bold">物件クレーム履歴</h1>
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
    .select('id, title, detail, status, created_at, property_id, company_id')
    .eq('company_id', companyId)
    .eq('property_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">物件クレーム履歴</h1>
        <p className="mt-4 text-sm text-red-600">{error.message}</p>
      </div>
    )
  }

  const openCount = (complaints ?? []).filter((item) => item.status !== '完了').length

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-sm text-gray-500">{property.name ?? '物件名未設定'}</p>
        <h1 className="mt-1 text-2xl font-bold">物件クレーム履歴</h1>
        <p className="mt-2 text-sm text-gray-600">
          この物件で発生したクレームを時系列で確認できます。
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
          href="/complaints"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          全クレーム一覧へ
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">クレーム総数</p>
          <p className="mt-2 text-3xl font-bold">{complaints?.length ?? 0}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">未完了クレーム</p>
          <p className="mt-2 text-3xl font-bold">{openCount}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">最新登録日時</p>
          <p className="mt-2 text-sm font-medium">
            {formatDateTime(complaints?.[0]?.created_at ?? null)}
          </p>
        </div>
      </div>

      {!complaints || complaints.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6">
          <p className="text-sm text-gray-700">この物件にはまだクレーム履歴がありません。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((item) => (
            <div key={item.id} className="rounded-2xl border bg-white p-5">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(item.status)}`}>
                  {item.status ?? '未設定'}
                </span>
                <span className="text-xs text-gray-500">{formatDateTime(item.created_at)}</span>
              </div>

              <h2 className="text-lg font-bold text-gray-900">{item.title ?? '件名未設定'}</h2>

              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-gray-700">
                {item.detail ?? '詳細なし'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}