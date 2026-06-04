import { notFound } from 'next/navigation'
import AiMinutesStudioClient from '@/app/components/AiMinutesStudioClient'
import BoardFlowNav from '@/app/components/BoardFlowNav'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

type PropertyRow = {
  id: string
  name: string | null
  company_id: string | null
}

type CaseRow = {
  id: string
  property_id: string
  title: string | null
  status: string | null
}

export default async function AiBoardMinutesProPage({ params }: PageProps) {
  const { id: propertyId, caseId } = await params
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  if (!companyId) {
    notFound()
  }

  const { data: property } = await supabase
    .from('properties')
    .select('id, name, company_id')
    .eq('id', propertyId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (!(property as PropertyRow | null)) {
    notFound()
  }

  const typedProperty = property as PropertyRow

  const { data: casesData } = await supabase
    .from('cases')
    .select('id, property_id, title, status')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })

  const cases = (casesData ?? []) as CaseRow[]
  const targetCase = cases.find((item) => item.id === caseId)

  if (!targetCase) {
    notFound()
  }

  return (
    <div>
      <div className="px-4 pt-6 sm:px-6 lg:px-8 mx-auto max-w-7xl">
        <BoardFlowNav currentStep="minutes" propertyId={propertyId} caseId={caseId} />
      </div>
      <AiMinutesStudioClient
        properties={[
          {
            id: typedProperty.id,
            name: typedProperty.name ?? '物件名未設定',
          },
        ]}
        cases={cases.map((caseItem) => ({
          id: caseItem.id,
          propertyId: caseItem.property_id,
          title: caseItem.title ?? '案件名未設定',
          status: caseItem.status ?? '',
        }))}
        lockedPropertyId={typedProperty.id}
        lockedCaseId={targetCase.id}
        lockedPropertyName={typedProperty.name ?? '物件名未設定'}
        lockedCaseTitle={targetCase.title ?? '案件名未設定'}
      />
    </div>
  )
}