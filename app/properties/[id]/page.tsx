import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type Props = {
  params: Promise<{
    id: string
  }>
}

type PropertyRow = {
  id: string
  name: string | null
  address: string | null
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const { data: property } = await supabase
    .from('properties')
    .select('id, name, address')
    .eq('id', id)
    .eq('company_id', companyId)
    .maybeSingle<PropertyRow>()

  if (!property) {
    return notFound()
  }

  const [
    { count: caseCount },
    { count: taskCount },
    { count: complaintCount },
    { count: handoverCount },
    { count: minutesCount },
  ] = await Promise.all([
    supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('property_id', id),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('property_id', id)
      .neq('status', 'done'),
    supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('property_id', id),
    supabase
      .from('handover_documents')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('property_id', id),
    supabase
      .from('ai_minutes_records')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('property_id', id),
  ])

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-emerald-600">物件詳細</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          {property.name || '無題物件'}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {property.address || '住所未設定'}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/properties"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            物件一覧へ
          </Link>

          <Link
            href={`/properties/${id}/cases/new`}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            案件を追加
          </Link>

          <Link
            href={`/properties/${id}/tasks/new`}
            className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            物件タスクを追加
          </Link>

          <Link
            href={`/handover-documents/new?propertyId=${id}`}
            className="rounded-xl bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800"
          >
            引き継ぎ書を作成
          </Link>

          <Link
            href={`/properties/${id}/cases`}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            案件一覧を見る
          </Link>

          <Link
            href={`/properties/${id}/tasks`}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            タスク一覧を見る
          </Link>

          <Link
            href={`/ai-minutes/records?propertyId=${id}`}
            className="rounded-xl border border-sky-300 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
          >
            この物件の保存済み議事録一覧
          </Link>

          <Link
            href={`/handover-documents?propertyId=${id}`}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            引き継ぎ一覧を見る
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">案件数</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{caseCount ?? 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">未完了タスク数</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{taskCount ?? 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">クレーム件数</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{complaintCount ?? 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">引き継ぎ書数</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{handoverCount ?? 0}</p>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
          <p className="text-sm text-sky-600">保存済み議事録数</p>
          <p className="mt-2 text-3xl font-bold text-sky-900">{minutesCount ?? 0}</p>
        </div>
      </section>
    </div>
  )
}