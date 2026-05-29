import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

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
      return NextResponse.json(
        { error: 'propertyId が不足しています。' },
        { status: 400 }
      )
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: '追加対象がありません。' },
        { status: 400 }
      )
    }

    let createdCount = 0

    for (const rawItem of items) {
      const item = isObject(rawItem) ? rawItem : {}
      const title = safeString(item.title) || 'AI議事録からの追加'
      const detail = safeString(item.detail)

      if (targetType === 'task') {
        await tryInsertSequentially(supabase, 'tasks', [
          {
            property_id: propertyId,
            case_id: caseId || null,
            title,
            status: '未完了',
            priority: '中',
            memo: `${sourceLabel}\n${detail}`.trim(),
          },
          {
            property_id: propertyId,
            case_id: caseId || null,
            title,
            status: '未完了',
            memo: `${sourceLabel}\n${detail}`.trim(),
          },
          {
            property_id: propertyId,
            case_id: caseId || null,
            title,
            status: '未完了',
          },
          {
            property_id: propertyId,
            title,
            status: '未完了',
            memo: `${sourceLabel}\n${detail}`.trim(),
          },
          {
            property_id: propertyId,
            title,
            status: '未完了',
          },
          {
            property_id: propertyId,
            title,
          },
          {
            property_id: propertyId,
            name: title,
            status: '未完了',
          },
          {
            property_id: propertyId,
            name: title,
          },
        ])
      } else {
        await tryInsertSequentially(supabase, 'cases', [
          {
            property_id: propertyId,
            title,
            status: '進行中',
            memo: `${sourceLabel}\n${detail}`.trim(),
          },
          {
            property_id: propertyId,
            title,
            status: '進行中',
          },
          {
            property_id: propertyId,
            title,
          },
          {
            property_id: propertyId,
            name: title,
            status: '進行中',
          },
          {
            property_id: propertyId,
            name: title,
          },
        ])
      }

      createdCount += 1
    }

    return NextResponse.json({
      ok: true,
      createdCount,
    })
  } catch (error) {
    console.error('ai/minutes/actions route error', error)

    return NextResponse.json(
      { error: '宿題の追加に失敗しました。' },
      { status: 500 }
    )
  }
}