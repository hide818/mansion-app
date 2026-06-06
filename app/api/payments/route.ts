import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const propertyId = url.searchParams.get('property_id')
  const year = url.searchParams.get('year') ?? new Date().getFullYear().toString()
  const month = url.searchParams.get('month') ?? String(new Date().getMonth() + 1)

  let query = supabase
    .from('payment_records')
    .select('*, units(unit_number, floor), residents!inner(name, phone)')
    .eq('company_id', companyId)
    .eq('billing_year', parseInt(year))
    .eq('billing_month', parseInt(month))
    .order('units(unit_number)')

  if (propertyId) query = query.eq('property_id', propertyId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // 一括生成：property_id + year + month で全戸室分を作成
  if (body.bulk && body.property_id) {
    const { data: units } = await supabase
      .from('units')
      .select('id')
      .eq('property_id', body.property_id)
      .eq('company_id', companyId)

    if (!units?.length) return NextResponse.json({ error: '戸室が登録されていません' }, { status: 400 })

    const records = units.map(u => ({
      unit_id: u.id,
      property_id: body.property_id,
      company_id: companyId,
      billing_year: body.billing_year,
      billing_month: body.billing_month,
      management_fee: body.management_fee ?? 0,
      reserve_fund: body.reserve_fund ?? 0,
      other_fee: body.other_fee ?? 0,
    }))

    const { data, error } = await supabase
      .from('payment_records')
      .upsert(records, { onConflict: 'unit_id,billing_year,billing_month' })
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ created: data?.length })
  }

  const { data, error } = await supabase
    .from('payment_records')
    .insert({ ...body, company_id: companyId })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
