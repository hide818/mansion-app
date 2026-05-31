import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export async function GET() {
  const companyId = await getUserCompanyId()
  if (!companyId) {
    return NextResponse.json({ error: '認証が必要です。' }, { status: 401 })
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('minutes_staff_members')
    .select('id, name, display_order, created_at')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[minutes-staff] GET error:', error)
    return NextResponse.json({ error: '担当者一覧の取得に失敗しました。' }, { status: 500 })
  }

  return NextResponse.json({ members: data ?? [] })
}

export async function POST(request: NextRequest) {
  const companyId = await getUserCompanyId()
  if (!companyId) {
    return NextResponse.json({ error: '認証が必要です。' }, { status: 401 })
  }

  const body = (await request.json()) as { name?: unknown }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return NextResponse.json({ error: '担当者名を入力してください。' }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()

  const { count } = await supabase
    .from('minutes_staff_members')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)

  const displayOrder = (count ?? 0) + 1

  const { data, error } = await supabase
    .from('minutes_staff_members')
    .insert({ company_id: companyId, name, display_order: displayOrder, is_active: true })
    .select('id, name, display_order, created_at')
    .single()

  if (error) {
    console.error('[minutes-staff] POST error:', error)
    return NextResponse.json({ error: '担当者の追加に失敗しました。' }, { status: 500 })
  }

  return NextResponse.json({ member: data })
}
