import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    if (!companyId) {
      return NextResponse.json({ error: 'ログインが必要です。' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('estimate_comparison_saves')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .maybeSingle()

    if (error) {
      console.error('estimate-comparison records GET [id] error', error)
      return NextResponse.json({ error: '詳細の取得に失敗しました。' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: '見つかりませんでした。' }, { status: 404 })
    }

    return NextResponse.json({ record: data })
  } catch (err) {
    console.error('estimate-comparison records GET [id] error', err)
    return NextResponse.json({ error: '詳細の取得に失敗しました。' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    if (!companyId) {
      return NextResponse.json({ error: 'ログインが必要です。' }, { status: 401 })
    }

    const { data: existing } = await supabase
      .from('estimate_comparison_saves')
      .select('id')
      .eq('id', id)
      .eq('company_id', companyId)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: '見つかりませんでした。' }, { status: 404 })
    }

    const { error } = await supabase
      .from('estimate_comparison_saves')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) {
      console.error('estimate-comparison records DELETE error', error)
      return NextResponse.json({ error: '削除に失敗しました。' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('estimate-comparison records DELETE error', err)
    return NextResponse.json({ error: '削除に失敗しました。' }, { status: 500 })
  }
}
