import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: 'CSVの生成に失敗しました' },
      { status: 500 }
    )
  }

  const header = [
    '案件ID',
    '案件名',
    'ステータス',
    '担当者',
    '物件ID',
    '作成日',
  ]

  const rows = (data ?? []).map((item) => [
    item.id ?? '',
    item.title ?? item.name ?? '',
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
}