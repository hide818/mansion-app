import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type RouteContext = {
  params: Promise<{
    reportId: string
  }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { reportId } = await context.params
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    if (!companyId) {
      return NextResponse.json(
        { error: '会社情報が取得できませんでした。' },
        { status: 401 }
      )
    }

    const { error } = await supabase
      .from('daily_reports')
      .delete()
      .eq('id', reportId)
      .eq('company_id', companyId)

    if (error) {
      return NextResponse.json(
        { error: `削除エラー: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: '削除中に予期しないエラーが発生しました。' },
      { status: 500 }
    )
  }
}