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
      management_memo,
      board_memo,
      caution_notes,
      officer_memo,
      pinned_note,
    } = body

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

    const { error: upsertError } = await supabase
      .from('property_cards')
      .upsert(
        {
          property_id: id,
          management_memo: management_memo ?? '',
          board_memo: board_memo ?? '',
          caution_notes: caution_notes ?? '',
          officer_memo: officer_memo ?? '',
          pinned_note: pinned_note ?? '',
        },
        {
          onConflict: 'property_id',
        }
      )

    if (upsertError) {
      return NextResponse.json(
        { error: upsertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '保存中に不明なエラーが発生しました。'

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}