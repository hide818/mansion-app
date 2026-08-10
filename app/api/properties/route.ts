import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('properties')
    .select('id, name, address')
    .eq('company_id', companyId)
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const name = (body.name ?? '').trim()
  if (!name) return NextResponse.json({ error: '物件名は必須です' }, { status: 400 })

  const { data, error } = await supabase
    .from('properties')
    .insert({
      company_id: companyId,
      name,
      address: (body.address ?? '').trim() || null,
      total_units: body.total_units ? Number(body.total_units) : null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
