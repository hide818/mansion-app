import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { isValidUuid } from '@/lib/isValidUuid'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    if (!companyId) {
      return NextResponse.json(
        { error: '会社情報が取得できませんでした。' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const propertyId =
      typeof body.propertyId === 'string' && isValidUuid(body.propertyId)
        ? body.propertyId
        : null

    const reportType =
      typeof body.reportType === 'string' && body.reportType.trim()
        ? body.reportType
        : null

    const reportMode =
      typeof body.reportMode === 'string' && body.reportMode.trim()
        ? body.reportMode
        : 'detail'

    const title =
      typeof body.title === 'string' && body.title.trim()
        ? body.title
        : null

    const reportBody =
      typeof body.body === 'string' && body.body.trim()
        ? body.body
        : null

    if (!reportType || !title || !reportBody) {
      return NextResponse.json(
        { error: '保存に必要な情報が不足しています。' },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().slice(0, 10)

    const { error } = await supabase.from('daily_reports').insert({
      company_id: companyId,
      property_id: propertyId,
      report_type: reportType,
      report_mode: reportMode,
      report_date: today,
      title,
      body: reportBody,
    })

    if (error) {
      return NextResponse.json(
        { error: `保存エラー: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: '保存中に予期しないエラーが発生しました。' },
      { status: 500 }
    )
  }
}