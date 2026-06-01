import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import EstimateComparisonHistoryClient from '@/app/components/EstimateComparisonHistoryClient'

type VendorItem = {
  vendorName: string
}

type RecordSummary = {
  id: string
  project_title: string
  vendors: VendorItem[]
  selected_sections: string[]
  created_at: string
  updated_at: string
}

export default async function EstimateComparisonHistoryPage() {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  if (!companyId) {
    return (
      <div className="p-6 lg:p-10">
        <div className="mx-auto max-w-5xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">ログインが必要です</h1>
          <p className="mt-3 text-sm text-slate-600">
            この画面を表示するにはログインしてください。
          </p>
        </div>
      </div>
    )
  }

  const { data, error } = await supabase
    .from('estimate_comparison_saves')
    .select('id, project_title, vendors, selected_sections, created_at, updated_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return (
      <div className="p-6 lg:p-10">
        <div className="mx-auto max-w-5xl rounded-[28px] border border-rose-200 bg-rose-50 p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-rose-700">データの取得に失敗しました</h1>
          <p className="mt-3 text-sm text-rose-600">
            時間をおいて再度お試しください。
          </p>
        </div>
      </div>
    )
  }

  const records: RecordSummary[] = (data ?? []).map((row) => ({
    id: String(row.id),
    project_title: typeof row.project_title === 'string' ? row.project_title : '',
    vendors: Array.isArray(row.vendors) ? (row.vendors as VendorItem[]) : [],
    selected_sections: Array.isArray(row.selected_sections)
      ? (row.selected_sections as string[])
      : [],
    created_at: typeof row.created_at === 'string' ? row.created_at : '',
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : '',
  }))

  return <EstimateComparisonHistoryClient initialRecords={records} />
}
