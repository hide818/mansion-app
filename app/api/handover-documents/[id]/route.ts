import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { error: '削除対象のIDがありません。' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'ログインが必要です。' },
        { status: 401 }
      )
    }

    const companyId = await getUserCompanyId()

    const { data: existingDocument, error: fetchError } = await supabase
      .from('handover_documents')
      .select('id, company_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingDocument) {
      return NextResponse.json(
        { error: '対象の引き継ぎ書が見つかりません。' },
        { status: 404 }
      )
    }

    if (existingDocument.company_id !== companyId) {
      return NextResponse.json(
        { error: 'この引き継ぎ書を削除する権限がありません。' },
        { status: 403 }
      )
    }

    const { error: deleteError } = await supabase
      .from('handover_documents')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || '削除に失敗しました。' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '削除時に不明なエラーが発生しました。'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}