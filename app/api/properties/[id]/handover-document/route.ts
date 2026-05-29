import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const propertyId = params.id

    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    const { data, error } = await supabase
      .from('handover_documents')
      .select('id, property_id, company_id, title, content, generated_content, created_at, updated_at')
      .eq('property_id', propertyId)
      .eq('company_id', companyId)
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        { error: '引き継ぎ書の取得に失敗しました', detail: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ document: data ?? null })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'サーバーエラーが発生しました',
        detail: error instanceof Error ? error.message : 'unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const propertyId = params.id

    const body = await request.json()
    const content = typeof body.content === 'string' ? body.content : ''
    const generatedContent =
      typeof body.generatedContent === 'string' ? body.generatedContent : ''
    const title =
      typeof body.title === 'string' && body.title.trim()
        ? body.title.trim()
        : '引き継ぎ書'

    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    const { data: existing, error: existingError } = await supabase
      .from('handover_documents')
      .select('id')
      .eq('property_id', propertyId)
      .eq('company_id', companyId)
      .maybeSingle()

    if (existingError) {
      return NextResponse.json(
        { error: '保存前チェックに失敗しました', detail: existingError.message },
        { status: 500 }
      )
    }

    if (existing?.id) {
      const { data, error } = await supabase
        .from('handover_documents')
        .update({
          title,
          content,
          generated_content: generatedContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id, property_id, company_id, title, content, generated_content, created_at, updated_at')
        .single()

      if (error) {
        return NextResponse.json(
          { error: '引き継ぎ書の更新に失敗しました', detail: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ ok: true, document: data })
    }

    const { data, error } = await supabase
      .from('handover_documents')
      .insert({
        property_id: propertyId,
        company_id: companyId,
        title,
        content,
        generated_content: generatedContent,
      })
      .select('id, property_id, company_id, title, content, generated_content, created_at, updated_at')
      .single()

    if (error) {
      return NextResponse.json(
        { error: '引き継ぎ書の保存に失敗しました', detail: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, document: data })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'サーバーエラーが発生しました',
        detail: error instanceof Error ? error.message : 'unknown error',
      },
      { status: 500 }
    )
  }
}