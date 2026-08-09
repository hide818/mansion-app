import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const companyId = await getUserCompanyId()
  if (!companyId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const supabase = await createSupabaseServerClient()

  const body = await request.json()
  const { data, error } = await supabase
    .from('business_plans')
    .update({
      name: body.name,
      budget_amount: body.budget_amount ?? null,
      account_category_id: body.account_category_id ?? null,
      account_category_text: body.account_category_text ?? null,
      contractor: body.contractor ?? null,
      scheduled_date: body.scheduled_date ?? null,
      status: body.status,
      actual_amount: body.actual_amount ?? null,
      notes: body.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('company_id', companyId)
    .select('*, account_categories(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const companyId = await getUserCompanyId()
  if (!companyId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('business_plans')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
