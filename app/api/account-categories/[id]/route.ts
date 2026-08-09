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
    .from('account_categories')
    .update({ name: body.name, display_order: body.display_order })
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
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
    .from('account_categories')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
