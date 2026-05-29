import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    const body = await request.json()

    const {
      title,
      category,
      location,
      reporter_name,
      detail,
      status,
      is_repeat,
    } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: '件名を入力してください。' },
        { status: 400 }
      )
    }

    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, company_id')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()

    if (propertyError || !property) {
      return NextResponse.json(
        { error: '対象の物件が見つかりません。' },
        { status: 404 }
      )
    }

    const { error: insertError } = await supabase
      .from('complaints')
      .insert({
        company_id: companyId,
        property_id: id,
        title,
        category: category ?? 'その他',
        location: location ?? '',
        reporter_name: reporter_name ?? '',
        detail: detail ?? '',
        status: status ?? '受付',
        is_repeat: Boolean(is_repeat),
      })

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '登録中に不明なエラーが発生しました。'

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}