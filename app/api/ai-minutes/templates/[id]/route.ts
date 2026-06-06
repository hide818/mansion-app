import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    const { error } = await supabase
      .from('minutes_templates')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) {
      return NextResponse.json({ error: '削除に失敗しました。' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '削除中にエラーが発生しました。' }, { status: 500 })
  }
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    // 全テンプレートを非アクティブ → 対象だけアクティブに
    await supabase
      .from('minutes_templates')
      .update({ is_active: false })
      .eq('company_id', companyId)

    const { error } = await supabase
      .from('minutes_templates')
      .update({ is_active: true })
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) {
      return NextResponse.json({ error: '更新に失敗しました。' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '更新中にエラーが発生しました。' }, { status: 500 })
  }
}
