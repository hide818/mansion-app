import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { isValidUuid } from '@/lib/isValidUuid'

export const runtime = 'nodejs'

type RequestItem = {
  title?: string
  detail?: string
  recommendedType?: 'task' | 'case'
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

async function tryInsertSequentially(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  table: 'tasks' | 'cases',
  payloads: Record<string, unknown>[]
) {
  let lastError: unknown = null

  for (const payload of payloads) {
    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select('*')
      .single()

    if (!error) {
      return data
    }

    lastError = error
  }

  throw lastError instanceof Error ? lastError : new Error('insert failed')
}

export async function POST(request: NextRequest) {
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

    const body = (await request.json()) as {
      targetType?: 'task' | 'case'
      propertyId?: string
      caseId?: string | null
      items?: RequestItem[]
      sourceLabel?: string
    }

    const targetType = body.targetType === 'case' ? 'case' : 'task'
    const propertyId = safeString(body.propertyId)
    const caseId = safeString(body.caseId)
    const sourceLabel = safeString(body.sourceLabel) || 'AI議事録'
    const items = Array.isArray(body.items) ? body.items : []

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId が不足しています。' }, { status: 400 })
    }

    if (!isValidUuid(propertyId)) {
      return NextResponse.json({ error: 'propertyId の形式が不正です。' }, { status: 400 })
    }

    // company_id で物件の所有権を確認
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .eq('company_id', companyId)
      .maybeSingle()

    if (propertyError || !property) {
      return NextResponse.json({ error: '対象の物件が見つかりません。' }, { status: 404 })
    }

    if (items.length === 0) {
      return NextResponse.json({ error: '追加対象がありません。' }, { status: 400 })
    }

    let createdCount = 0

    for (const rawItem of items) {
      const item = isObject(rawItem) ? rawItem : {}
      const title = safeString(item.title) || 'AI議事録からの追加'
      const detail = safeString(item.detail)

      if (targetType === 'task') {
        await tryInsertSequentially(supabase, 'tasks', [
          {
            company_id: companyId,
            property_id: propertyId,
            case_id: caseId || null,
            title,
            status: '未完了',
            priority: '中',
            memo: `${sourceLabel}\n${detail}`.trim(),
          },
          {
            company_id: companyId,
            property_id: propertyId,
            case_id: caseId || null,
            title,
            status: '未完了',
          },
          {
            company_id: companyId,
            property_id: propertyId,
            title,
            status: '未完了',
          },
          {
            company_id: companyId,
            property_id: propertyId,
            title,
          },
        ])
      } else {
        await tryInsertSequentially(supabase, 'cases', [
          {
            company_id: companyId,
            property_id: propertyId,
            title,
            status: '進行中',
            memo: `${sourceLabel}\n${detail}`.trim(),
          },
          {
            company_id: companyId,
            property_id: propertyId,
            title,
            status: '進行中',
          },
          {
            company_id: companyId,
            property_id: propertyId,
            title,
          },
        ])
      }

      createdCount += 1
    }

    return NextResponse.json({ ok: true, createdCount })
  } catch (error) {
    console.error('ai/minutes/actions route error', error)
    return NextResponse.json({ error: '宿題の追加に失敗しました。' }, { status: 500 })
  }
}
