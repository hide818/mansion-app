import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const companyId = await getUserCompanyId()
  if (!companyId) {
    return NextResponse.json({ error: '認証が必要です。' }, { status: 401 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'id が指定されていません。' }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('minutes_staff_members')
    .update({ is_active: false })
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) {
    console.error('[minutes-staff] PATCH error:', error)
    return NextResponse.json({ error: '担当者の無効化に失敗しました。' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
