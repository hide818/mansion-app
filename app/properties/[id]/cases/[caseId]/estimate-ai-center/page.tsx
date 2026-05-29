import { notFound } from 'next/navigation'
import EstimateComparisonCenterClient from '@/app/components/EstimateComparisonCenterClient'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type EstimateAiCenterPageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function EstimateAiCenterPage({
  params,
}: EstimateAiCenterPageProps) {
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

  if (!property) {
    notFound()
  }

  const { data: caseRow } = await supabase
    .from('cases')
    .select('id, title, property_id')
    .eq('id', caseId)
    .eq('property_id', propertyId)
    .maybeSingle()

  if (!caseRow) {
    notFound()
  }

  return (
    <EstimateComparisonCenterClient
      propertyId={propertyId}
      caseId={caseId}
      propertyName={property.name ?? '物件名未設定'}
      caseTitle={caseRow.title ?? '案件名未設定'}
    />
  )
}