import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import {
  buildFallbackEstimateComparison,
  extractJsonObject,
  sanitizeEstimateComparisonResult,
  sanitizeEstimateInputs,
  type EstimateComparisonResult,
  type EstimateInput,
} from '@/lib/estimateComparison'

export const runtime = 'nodejs'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null

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

async function resolvePropertyAndCase(
  supabase: ServerSupabase,
  propertyId: string,
  caseId: string
) {
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, name, company_id')
    .eq('id', propertyId)
    .maybeSingle()

  if (propertyError) throw propertyError
  if (!property) throw new Error('物件が見つかりません。')

  const { data: caseRow, error: caseError } = await supabase
    .from('cases')
    .select('id, title, property_id')
    .eq('id', caseId)
    .eq('property_id', propertyId)
    .maybeSingle()

  if (caseError) throw caseError
  if (!caseRow) throw new Error('案件が見つかりません。')

  return {
    propertyName: property.name ?? '物件名未設定',
    caseTitle: caseRow.title ?? '案件名未設定',
  }
}

function buildPrompt(params: {
  comparisonName: string
  propertyName: string
  caseTitle: string
  vendors: EstimateInput[]
}) {
  const vendorText = params.vendors
    .map((vendor, index) => {
      return [
        `【業者${index + 1}】`,
        `業者名: ${vendor.vendorName || '-'}`,
        `見出し: ${vendor.headline || '-'}`,
        `金額メモ: ${vendor.priceText || '-'}`,
        `補足: ${vendor.notes || '-'}`,
        `見積本文:`,
        vendor.estimateText || '-',
      ].join('\n')
    })
    .join('\n\n')

  return `
あなたはマンション管理会社向けの見積比較アシスタントです。
以下の見積情報を比較し、必ずJSONのみで返してください。
説明文やコードブロックは禁止です。

返すJSONの形:
{
  "summary": "要約",
  "recommendedVendor": "推奨業者名",
  "recommendedReason": "推奨理由",
  "strengths": ["強み1", "強み2"],
  "cautions": ["注意点1", "注意点2"],
  "questions": ["確認質問1", "確認質問2"],
  "comparisonTable": [
    {
      "item": "比較項目",
      "vendorA": "業者Aの内容",
      "vendorB": "業者Bの内容",
      "vendorC": "業者Cの内容",
      "comment": "比較コメント"
    }
  ],
  "comparisonComment": "比較コメント",
  "boardComment": "理事会用コメント",
  "bossComment": "上司報告コメント",
  "vendorQuestionText": "業者への確認文",
  "recommendationMemo": "推奨メモ"
}

物件: ${params.propertyName}
案件: ${params.caseTitle}
比較名: ${params.comparisonName}

見積情報:
${vendorText}
  `.trim()
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: propertyId, caseId } = await context.params
    const supabase = await createSupabaseServerClient()
    const body: unknown = await request.json()

    const resolved = await resolvePropertyAndCase(supabase, propertyId, caseId)

    const comparisonName =
      isObject(body) && safeString(body.comparisonName)
        ? safeString(body.comparisonName)
        : `${resolved.caseTitle} 見積比較`

    const vendors = sanitizeEstimateInputs(
      isObject(body) ? body.vendors : []
    )

    if (vendors.length < 2) {
      return NextResponse.json(
        { error: '比較には2社以上の見積本文が必要です。' },
        { status: 400 }
      )
    }

    let result: EstimateComparisonResult = buildFallbackEstimateComparison({
      comparisonName,
      propertyName: resolved.propertyName,
      caseTitle: resolved.caseTitle,
      vendors,
    })

    let aiUsed = false

    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_ESTIMATE_MODEL ?? 'gpt-4.1-mini',
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'あなたは見積比較JSONを返すアシスタントです。必ずJSONのみを返してください。',
            },
            {
              role: 'user',
              content: buildPrompt({
                comparisonName,
                propertyName: resolved.propertyName,
                caseTitle: resolved.caseTitle,
                vendors,
              }),
            },
          ],
        })

        const aiText = completion.choices[0]?.message?.content ?? ''
        const parsed = extractJsonObject(aiText)

        if (parsed) {
          result = sanitizeEstimateComparisonResult(parsed)
          aiUsed = true
        }
      } catch (error) {
        console.error('estimate-ai-center openai error', error)
      }
    }

    return NextResponse.json({
      ok: true,
      comparisonName,
      propertyName: resolved.propertyName,
      caseTitle: resolved.caseTitle,
      result,
      aiUsed,
    })
  } catch (error) {
    console.error('estimate-ai-center route error', error)

    return NextResponse.json(
      { error: 'AI見積比較の実行に失敗しました。' },
      { status: 500 }
    )
  }
}