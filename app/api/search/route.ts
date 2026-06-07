import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserProfile } from '@/lib/getUserProfile'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const profile = await getUserProfile()
  if (!profile?.company_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companyId = profile.company_id
  const canViewAll = profile.role === 'admin' || profile.can_view_all_data === true

  const q = new URL(req.url).searchParams.get('q')?.trim()
  if (!q || q.length < 1) return NextResponse.json({ properties: [], residents: [], cases: [], inspections: [], contractors: [] })

  const pattern = `%${q}%`

  let casesQuery = supabase.from('cases').select('id, title, status, properties(name)').eq('company_id', companyId).ilike('title', pattern).limit(5)
  if (!canViewAll) casesQuery = casesQuery.eq('assigned_to', profile.id)

  const [propRes, resRes, caseRes, insRes, conRes] = await Promise.all([
    supabase.from('properties').select('id, name, address').eq('company_id', companyId).ilike('name', pattern).limit(5),
    supabase.from('residents').select('id, name, name_kana, phone, properties(name), units(unit_number)').eq('company_id', companyId).eq('is_active', true).or(`name.ilike.${pattern},name_kana.ilike.${pattern},phone.ilike.${pattern}`).limit(5),
    casesQuery,
    supabase.from('inspections').select('id, inspection_name, next_due_date, properties(name)').eq('company_id', companyId).ilike('inspection_name', pattern).limit(5),
    supabase.from('contractors').select('id, name, phone').eq('company_id', companyId).eq('is_active', true).ilike('name', pattern).limit(5),
  ])

  return NextResponse.json({
    properties: propRes.data ?? [],
    residents: resRes.data ?? [],
    cases: caseRes.data ?? [],
    inspections: insRes.data ?? [],
    contractors: conRes.data ?? [],
  })
}
