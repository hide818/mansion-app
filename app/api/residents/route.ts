import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const propertyId = url.searchParams.get('property_id')
  const unitId = url.searchParams.get('unit_id')
  const search = url.searchParams.get('search')

  let query = supabase
    .from('residents')
    .select('*, units(unit_number, floor, layout), properties(name)')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name')

  if (propertyId) query = query.eq('property_id', propertyId)
  if (unitId) query = query.eq('unit_id', unitId)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('residents')
    .insert({ ...body, company_id: companyId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
