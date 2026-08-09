import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { redirect } from 'next/navigation'
import BusinessPlansClient from './BusinessPlansClient'

export const metadata = { title: '事業計画進捗管理 | Kura' }

export default async function BusinessPlansPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: propertyId } = await params
  const companyId = await getUserCompanyId()
  if (!companyId) redirect('/login')
  const supabase = await createSupabaseServerClient()

  const [{ data: property }, { data: plans }, { data: categories }] = await Promise.all([
    supabase.from('properties').select('id, name').eq('id', propertyId).eq('company_id', companyId).single(),
    supabase.from('business_plans').select('*, account_categories(name)').eq('property_id', propertyId).eq('company_id', companyId).order('fiscal_year', { ascending: false }).order('created_at'),
    supabase.from('account_categories').select('id, name').eq('company_id', companyId).order('display_order').order('created_at'),
  ])

  if (!property) redirect('/properties')

  return (
    <BusinessPlansClient
      propertyId={propertyId}
      propertyName={property.name}
      initialPlans={plans ?? []}
      categories={categories ?? []}
    />
  )
}
