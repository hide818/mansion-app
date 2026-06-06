import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export const runtime = 'nodejs'

const MAX_SAMPLE_CHARS = 4000

function truncate(text: string) {
  return text.length > MAX_SAMPLE_CHARS ? text.slice(0, MAX_SAMPLE_CHARS) : text
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    const { data, error } = await supabase
      .from('minutes_templates')
      .select('id, name, is_active, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'テンプレート一覧の取得に失敗しました。' }, { status: 500 })
    }

    return NextResponse.json({ templates: data ?? [] })
  } catch {
    return NextResponse.json({ error: '取得中にエラーが発生しました。' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const rawText = String(formData.get('rawText') ?? '').trim()
    const name = String(formData.get('name') ?? '').trim()

    if (!name) {
      return NextResponse.json({ error: 'テンプレート名を入力してください。' }, { status: 400 })
    }

    let sampleText = ''

    if (rawText) {
      // テキスト直接入力モード
      sampleText = truncate(rawText)
    } else if (file instanceof File) {
      // PDFアップロードモード
      if (file.size === 0) {
        return NextResponse.json({ error: 'ファイルが空です。' }, { status: 400 })
      }
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext !== 'pdf') {
        return NextResponse.json({ error: 'PDFファイルのみ対応しています。' }, { status: 400 })
      }
      type PDFParseClass = new (opts: { data: Buffer }) => { getText(): Promise<{ text: string }>; destroy(): Promise<void> }
      const { PDFParse } = (await import('pdf-parse')) as unknown as { PDFParse: PDFParseClass }
      const buffer = Buffer.from(await file.arrayBuffer())
      const parser = new PDFParse({ data: buffer })
      const parsed = await parser.getText()
      await parser.destroy()
      sampleText = truncate(parsed.text.trim())
      if (!sampleText) {
        return NextResponse.json({ error: 'PDFからテキストを抽出できませんでした。' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'PDFファイルまたはテキストを入力してください。' }, { status: 400 })
    }

    // 既存テンプレートをすべて非アクティブに
    await supabase
      .from('minutes_templates')
      .update({ is_active: false })
      .eq('company_id', companyId)

    const { data, error } = await supabase
      .from('minutes_templates')
      .insert({
        company_id: companyId,
        name,
        sample_text: sampleText,
        is_active: true,
        created_by: user.id,
      })
      .select('id, name, is_active, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: 'テンプレートの保存に失敗しました。', detail: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, template: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('minutes-templates POST error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
