import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type PropertyRow = {
  id: string
  name: string | null
  address: string | null
  created_at: string | null
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

export default async function PropertiesPage() {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const { data, error } = await supabase
    .from('properties')
    .select('id, name, address, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-600">物件一覧</p>
          <h1 className="mt-1 text-3xl font-bold text-red-700">物件の取得に失敗しました</h1>
          <p className="mt-4 text-sm text-red-600">{error.message}</p>
        </div>
      </div>
    )
  }

  const properties = (data ?? []) as PropertyRow[]

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">案件・タスク管理</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">物件一覧</h1>
            <p className="mt-2 text-sm text-slate-600">
              物件を選んで、案件・タスク管理へ進みます。
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">登録物件</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {properties.length}件
          </span>
        </div>

        {properties.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            物件データはまだありません。
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => (
              <Link
                key={property.id}
                href={`/properties/${property.id}`}
                className="block rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-slate-100"
              >
                <p className="text-lg font-bold text-slate-900">
                  {property.name || '無題物件'}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {property.address || '住所未設定'}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  登録日: {formatDate(property.created_at)}
                </p>
                <p className="mt-4 text-sm font-medium text-emerald-700">
                  物件詳細へ →
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}