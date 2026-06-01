import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import EstimateComparisonSaveDetailClient, {
  type SaveRecord,
} from '@/app/components/EstimateComparisonSaveDetailClient'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EstimateComparisonHistoryDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  if (!companyId) {
    return (
      <div className="p-6 lg:p-10">
        <div className="mx-auto max-w-5xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">ログインが必要です</h1>
        </div>
      </div>
    )
  }

  const { data, error } = await supabase
    .from('estimate_comparison_saves')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .maybeSingle()

  if (error || !data) {
    notFound()
  }

  const record: SaveRecord = {
    id: String(data.id),
    project_title: typeof data.project_title === 'string' ? data.project_title : '',
    base_estimate_text:
      typeof data.base_estimate_text === 'string' ? data.base_estimate_text : '',
    vendors: Array.isArray(data.vendors)
      ? (data.vendors as SaveRecord['vendors'])
      : [],
    selected_sections: Array.isArray(data.selected_sections)
      ? (data.selected_sections as string[])
      : [],
    result: (data.result ?? {}) as SaveRecord['result'],
    created_at: typeof data.created_at === 'string' ? data.created_at : '',
    updated_at: typeof data.updated_at === 'string' ? data.updated_at : '',
  }

  return <EstimateComparisonSaveDetailClient record={record} />
}
