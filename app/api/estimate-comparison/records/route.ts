import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export const runtime = 'nodejs'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    if (!companyId) {
      return NextResponse.json({ error: 'ログインが必要です。' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('estimate_comparison_saves')
      .select('id, project_title, vendors, selected_sections, created_at, updated_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      console.error('estimate-comparison records GET error', error)
      return NextResponse.json({ error: '履歴の取得に失敗しました。' }, { status: 500 })
    }

    return NextResponse.json({ records: data ?? [] })
  } catch (err) {
    console.error('estimate-comparison records GET error', err)
    return NextResponse.json({ error: '履歴の取得に失敗しました。' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'ログインが必要です。' }, { status: 401 })
    }

    const companyId = await getUserCompanyId()
    if (!companyId) {
      return NextResponse.json({ error: '所属会社が確認できません。' }, { status: 403 })
    }

    const body: unknown = await request.json()

    if (!isObject(body)) {
      return NextResponse.json({ error: 'リクエスト形式が不正です。' }, { status: 400 })
    }

    const projectTitle = safeString(body.projectTitle) || '工事見積比較'
    const baseEstimateText = safeString(body.baseEstimateText)

    if (!baseEstimateText) {
      return NextResponse.json(
        { error: '基準見積の内容が必要です。' },
        { status: 400 }
      )
    }

    const vendors = Array.isArray(body.vendors) ? body.vendors : []
    const selectedSections = Array.isArray(body.selectedSections) ? body.selectedSections : []
    const result = isObject(body.result) ? body.result : {}
    const memo = safeString(body.memo) || null

    const { data, error } = await supabase
      .from('estimate_comparison_saves')
      .insert({
        company_id: companyId,
        created_by: user.id,
        project_title: projectTitle,
        base_estimate_text: baseEstimateText,
        vendors,
        selected_sections: selectedSections,
        result,
        memo,
        updated_at: new Date().toISOString(),
      })
      .select('id, project_title, created_at')
      .single()

    if (error) {
      console.error('estimate-comparison records POST error', error)
      return NextResponse.json(
        { error: '保存に失敗しました。', detail: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, record: data })
  } catch (err) {
    console.error('estimate-comparison records POST error', err)
    return NextResponse.json({ error: '保存に失敗しました。' }, { status: 500 })
  }
}
