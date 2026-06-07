import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserProfile } from '@/lib/getUserProfile'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const profile = await getUserProfile()
  if (!profile?.company_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const canViewAll = profile.role === 'admin' || profile.can_view_all_data === true

  const url = new URL(req.url)
  const limit = parseInt(url.searchParams.get('limit') ?? '100')
  const caseId = url.searchParams.get('case_id')

  let query = supabase
    .from('tasks')
    .select('*, cases(id, title)')
    .eq('company_id', profile.company_id)
    .order('due_date', { ascending: true })
    .limit(limit)

  if (caseId) query = query.eq('case_id', caseId)
  if (!canViewAll) query = query.eq('assigned_to', profile.id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
