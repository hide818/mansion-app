import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import EstimateComparisonAiClient, {
  type InitialData,
} from '@/app/components/EstimateComparisonAiClient'

type SearchParams = Promise<{ from?: string }>

export default async function EstimateComparisonPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const fromId = params.from?.trim()

  let initialData: InitialData | undefined

  if (fromId) {
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    if (companyId) {
      const { data } = await supabase
        .from('estimate_comparison_saves')
        .select('project_title, base_estimate_text, vendors, selected_sections')
        .eq('id', fromId)
        .eq('company_id', companyId)
        .maybeSingle()

      if (data) {
        initialData = {
          projectTitle: typeof data.project_title === 'string' ? data.project_title : '',
          baseEstimateText:
            typeof data.base_estimate_text === 'string' ? data.base_estimate_text : '',
          vendors: Array.isArray(data.vendors)
            ? (
                data.vendors as {
                  vendorName: string
                  amountText: string
                  editableText: string
                }[]
              )
            : [],
          selectedSections: Array.isArray(data.selected_sections)
            ? (data.selected_sections as string[])
            : [],
        }
      }
    }
  }

  return <EstimateComparisonAiClient initialData={initialData} />
}
