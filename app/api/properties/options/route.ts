import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    const { data, error } = await supabase
      .from('properties')
      .select('id, name')
      .eq('company_id', companyId)
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      )
    }

    const properties = (data ?? []).map((item) => ({
      id: String(item.id),
      name: String(item.name ?? '').trim() || '無題物件',
    }))

    return NextResponse.json({ properties })
  } catch (error) {
    console.error('Properties options route error:', error)

    return NextResponse.json(
      { error: '物件一覧の取得中にエラーが発生しました。' },
      { status: 500 },
    )
  }
}