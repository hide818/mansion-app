import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export async function GET(request: NextRequest) {
  const companyId = await getUserCompanyId()
  if (!companyId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const supabase = await createSupabaseServerClient()

  const { searchParams } = new URL(request.url)
  const propertyId = searchParams.get('property_id')
  const fiscalYear = searchParams.get('fiscal_year')

  let query = supabase
    .from('business_plans')
    .select('*, account_categories(name)')
    .eq('company_id', companyId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (propertyId) query = query.eq('property_id', propertyId)
  if (fiscalYear) query = query.eq('fiscal_year', parseInt(fiscalYear))

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const companyId = await getUserCompanyId()
  if (!companyId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json()
  const { property_id, fiscal_year, name, budget_amount, account_category_id, contractor, scheduled_date, status, actual_amount, notes } = body

  if (!property_id || !fiscal_year || !name?.trim()) {
    return NextResponse.json({ error: '物件・年度・計画名は必須です' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('business_plans')
    .insert({
      company_id: companyId,
      property_id,
      fiscal_year,
      name: name.trim(),
      budget_amount: budget_amount || null,
      account_category_id: account_category_id || null,
      contractor: contractor?.trim() || null,
      scheduled_date: scheduled_date || null,
      status: status || '未着手',
      actual_amount: actual_amount || null,
      notes: notes?.trim() || null,
      created_by: user.id,
    })
    .select('*, account_categories(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
