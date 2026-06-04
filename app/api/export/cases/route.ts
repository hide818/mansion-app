import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 })
    }

    const companyId = await getUserCompanyId()

    if (!companyId) {
      return NextResponse.json({ error: '会社情報が取得できません。' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('cases')
      .select('id, title, status, assignee, property_id, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'CSVの生成に失敗しました' }, { status: 500 })
    }

    const header = ['案件ID', '案件名', 'ステータス', '担当者', '物件ID', '作成日']

    const rows = (data ?? []).map((item) => [
      item.id ?? '',
      item.title ?? '',
      item.status ?? '',
      item.assignee ?? '',
      item.property_id ?? '',
      item.created_at ?? '',
    ])

    const escapeCsv = (value: string) => {
      const text = String(value ?? '')
      return `"${text.replace(/"/g, '""')}"`
    }

    const csvContent = [
      header.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n')

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="cases.csv"',
      },
    })
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 })
  }
}
