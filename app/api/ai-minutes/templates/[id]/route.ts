import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    const { data, error } = await supabase
      .from('minutes_templates')
      .select('id, name, is_active, sample_text, created_at')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: '取得に失敗しました。' }, { status: 404 })
    }

    return NextResponse.json({ template: data })
  } catch {
    return NextResponse.json({ error: '取得中にエラーが発生しました。' }, { status: 500 })
  }
}

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
