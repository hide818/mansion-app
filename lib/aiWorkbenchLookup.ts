import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type PropertyRow = {
  id: string
  name: string | null
  address: string | null
  company_id?: string | null
}

type CaseRow = {
  id: string
  title: string | null
  status: string | null
  assignee: string | null
  property_id: string | null
}

export async function getPropertyWorkbenchData(propertyId: string) {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  if (!companyId) return null

  const { data: property } = await supabase
    .from('properties')
    .select('id, name, address, company_id')
    .eq('id', propertyId)
    .eq('company_id', companyId)
    .maybeSingle<PropertyRow>()

  if (!property) return null

  return {
    companyId,
    property,
  }
}

export async function getCaseWorkbenchData(propertyId: string, caseId: string) {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  if (!companyId) return null

  const { data: property } = await supabase
    .from('properties')
    .select('id, name, address, company_id')
    .eq('id', propertyId)
    .eq('company_id', companyId)
    .maybeSingle<PropertyRow>()

  if (!property) return null

  const { data: caseRow } = await supabase
    .from('cases')
    .select('id, title, status, assignee, property_id')
    .eq('id', caseId)
    .eq('property_id', propertyId)
    .maybeSingle<CaseRow>()

  if (!caseRow) return null

  return {
    companyId,
    property,
    caseRow,
  }
}