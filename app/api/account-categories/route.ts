import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export async function GET() {
  const companyId = await getUserCompanyId()
  if (!companyId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('account_categories')
    .select('*')
    .eq('company_id', companyId)
    .order('display_order')
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const companyId = await getUserCompanyId()
  if (!companyId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const supabase = await createSupabaseServerClient()

  const { name, display_order } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: '名前は必須です' }, { status: 400 })

  const { data, error } = await supabase
    .from('account_categories')
    .insert({ company_id: companyId, name: name.trim(), display_order: display_order ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
