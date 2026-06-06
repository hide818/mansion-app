import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const limit = parseInt(url.searchParams.get('limit') ?? '100')
  const caseId = url.searchParams.get('case_id')

  let query = supabase
    .from('tasks')
    .select('*, cases(id, title)')
    .eq('company_id', companyId)
    .order('due_date', { ascending: true })
    .limit(limit)

  if (caseId) query = query.eq('case_id', caseId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
