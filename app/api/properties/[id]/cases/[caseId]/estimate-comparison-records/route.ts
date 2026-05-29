import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import {
  sanitizeEstimateComparisonResult,
  sanitizeEstimateInputs,
  type EstimateComparisonRecordStatus,
} from '@/lib/estimateComparison'

type RouteContext = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

type ServerSupabase = Awaited<ReturnType<typeof createSupabaseServerClient>>

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

async function resolvePropertyInfo(
  supabase: ServerSupabase,
  propertyId: string
) {
  const { data: property, error } = await supabase
    .from('properties')
    .select('id, company_id')
    .eq('id', propertyId)
    .maybeSingle()

  if (error) throw error
  if (!property) throw new Error('物件が見つかりません。')

  return property
}

function isMissingTableError(error: unknown) {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : ''

  return (
    message.includes('relation') ||
    message.includes('does not exist') ||
    message.includes('42P01')
  )
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id: propertyId, caseId } = await context.params
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
      .from('estimate_comparison_records')
      .select('*')
      .eq('property_id', propertyId)
      .eq('case_id', caseId)
      .order('updated_at', { ascending: false })

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json({ records: [] })
      }
      throw error
    }

    return NextResponse.json({
      records: data ?? [],
    })
  } catch (error) {
    console.error('estimate-comparison-records GET error', error)

    return NextResponse.json(
      { error: '保存履歴の取得に失敗しました。' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: propertyId, caseId } = await context.params
    const supabase = await createSupabaseServerClient()
    const body: unknown = await request.json()

    const action = isObject(body) ? safeString(body.action) : ''

    if (!action) {
      return NextResponse.json(
        { error: 'action が指定されていません。' },
        { status: 400 }
      )
    }

    if (action === 'delete') {
      const recordId = isObject(body) ? safeString(body.recordId) : ''

      if (!recordId) {
        return NextResponse.json(
          { error: 'recordId が指定されていません。' },
          { status: 400 }
        )
      }

      const { error } = await supabase
        .from('estimate_comparison_records')
        .delete()
        .eq('id', recordId)
        .eq('property_id', propertyId)
        .eq('case_id', caseId)

      if (error) throw error

      return NextResponse.json({ ok: true })
    }

    if (action !== 'save') {
      return NextResponse.json(
        { error: '未対応の action です。' },
        { status: 400 }
      )
    }

    const property = await resolvePropertyInfo(supabase, propertyId)

    const recordId = isObject(body) ? safeString(body.recordId) : ''
    const title =
      isObject(body) && safeString(body.title)
        ? safeString(body.title)
        : '見積比較'
    const status: EstimateComparisonRecordStatus =
      isObject(body) && safeString(body.status) === 'final'
        ? 'final'
        : 'draft'

    const vendors = sanitizeEstimateInputs(isObject(body) ? body.vendors : [])
    const result = sanitizeEstimateComparisonResult(
      isObject(body) ? body.result : {}
    )

    const payload = {
      company_id: property.company_id ?? null,
      property_id: propertyId,
      case_id: caseId,
      title,
      status,
      vendors,
      result,
      updated_at: new Date().toISOString(),
    }

    if (recordId) {
      const { data, error } = await supabase
        .from('estimate_comparison_records')
        .update(payload)
        .eq('id', recordId)
        .eq('property_id', propertyId)
        .eq('case_id', caseId)
        .select('*')
        .single()

      if (error) throw error

      return NextResponse.json({
        ok: true,
        record: data,
      })
    }

    const { data, error } = await supabase
      .from('estimate_comparison_records')
      .insert(payload)
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({
      ok: true,
      record: data,
    })
  } catch (error) {
    console.error('estimate-comparison-records POST error', error)

    return NextResponse.json(
      { error: '保存履歴の保存に失敗しました。' },
      { status: 500 }
    )
  }
}