export type EstimateInput = {
  vendorName: string
  headline: string
  estimateText: string
  priceText: string
  notes: string
}

export type EstimateComparisonRecordStatus = 'draft' | 'final'

export type EstimateComparisonTableRow = {
  item: string
  vendorA: string
  vendorB: string
  vendorC: string
  comment: string
}

export type EstimateComparisonResult = {
  summary: string
  recommendedVendor: string
  recommendedReason: string
  strengths: string[]
  cautions: string[]
  questions: string[]
  comparisonTable: EstimateComparisonTableRow[]
  comparisonComment: string
  boardComment: string
  bossComment: string
  vendorQuestionText: string
  recommendationMemo: string
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => safeString(item)).filter(Boolean)
}

function normalizeComparisonTable(
  value: unknown
): EstimateComparisonTableRow[] {
  if (!Array.isArray(value)) return []

  return value.map((row) => {
    const source = isObject(row) ? row : {}

    return {
      item: safeString(source.item),
      vendorA: safeString(source.vendorA ?? source.vendor_a),
      vendorB: safeString(source.vendorB ?? source.vendor_b),
      vendorC: safeString(source.vendorC ?? source.vendor_c),
      comment: safeString(source.comment),
    }
  })
}

export function sanitizeEstimateInputs(input: unknown): EstimateInput[] {
  if (!Array.isArray(input)) return []

  return input
    .map((item) => {
      const source = isObject(item) ? item : {}

      return {
        vendorName: safeString(source.vendorName ?? source.vendor_name),
        headline: safeString(source.headline),
        estimateText: safeString(source.estimateText ?? source.estimate_text),
        priceText: safeString(source.priceText ?? source.price_text),
        notes: safeString(source.notes),
      }
    })
    .filter(
      (vendor) =>
        vendor.vendorName !== '' ||
        vendor.headline !== '' ||
        vendor.estimateText !== '' ||
        vendor.priceText !== '' ||
        vendor.notes !== ''
    )
}

export function sanitizeEstimateComparisonResult(
  raw: unknown
): EstimateComparisonResult {
  const source = isObject(raw) ? raw : {}
  const resultSource = isObject(source.result) ? source.result : source

  return {
    summary: safeString(resultSource.summary),
    recommendedVendor: safeString(
      resultSource.recommendedVendor ?? resultSource.recommended_vendor
    ),
    recommendedReason: safeString(
      resultSource.recommendedReason ?? resultSource.recommended_reason
    ),
    strengths: safeStringArray(resultSource.strengths),
    cautions: safeStringArray(resultSource.cautions),
    questions: safeStringArray(resultSource.questions),
    comparisonTable: normalizeComparisonTable(
      resultSource.comparisonTable ?? resultSource.comparison_table
    ),
    comparisonComment: safeString(
      resultSource.comparisonComment ?? resultSource.comparison_comment
    ),
    boardComment: safeString(
      resultSource.boardComment ?? resultSource.board_comment
    ),
    bossComment: safeString(
      resultSource.bossComment ?? resultSource.boss_comment
    ),
    vendorQuestionText: safeString(
      resultSource.vendorQuestionText ?? resultSource.vendor_question_text
    ),
    recommendationMemo: safeString(
      resultSource.recommendationMemo ?? resultSource.recommendation_memo
    ),
  }
}

export const normalizeEstimateComparisonResult =
  sanitizeEstimateComparisonResult

export function extractJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  try {
    const parsed = JSON.parse(trimmed)
    return isObject(parsed) ? parsed : null
  } catch {
    // continue
  }

  const fencedMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/i)
  if (fencedMatch?.[1]) {
    try {
      const parsed = JSON.parse(fencedMatch[1])
      return isObject(parsed) ? parsed : null
    } catch {
      // continue
    }
  }

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const sliced = trimmed.slice(firstBrace, lastBrace + 1)

    try {
      const parsed = JSON.parse(sliced)
      return isObject(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  return null
}

export function buildFallbackEstimateComparison(params: {
  comparisonName?: string
  propertyName?: string
  caseTitle?: string
  vendors: EstimateInput[]
}): EstimateComparisonResult {
  const vendors = sanitizeEstimateInputs(params.vendors)
  const firstVendor = vendors[0]?.vendorName || '業者1'
  const secondVendor = vendors[1]?.vendorName || '業者2'
  const thirdVendor = vendors[2]?.vendorName || ''

  return {
    summary:
      vendors.length >= 2
        ? `${firstVendor}と${secondVendor}を中心に比較しました。金額、工事項目、補足条件を比較し、説明しやすい形に整理しています。`
        : '比較対象が不足しているため、十分な比較ができませんでした。',
    recommendedVendor: firstVendor,
    recommendedReason:
      `${firstVendor}を暫定推奨としています。金額、条件、保証、施工範囲の差を確認したうえで最終判断してください。`,
    strengths: vendors.map((vendor) => vendor.notes).filter(Boolean).slice(0, 3),
    cautions: [
      '金額だけでなく工事項目の差を確認してください。',
      '保証条件と施工範囲の違いを確認してください。',
    ],
    questions: [
      '見積に含まれない工事項目はありますか。',
      '保証年数と保証範囲はどう違いますか。',
    ],
    comparisonTable: [
      {
        item: '金額',
        vendorA: vendors[0]?.priceText || '-',
        vendorB: vendors[1]?.priceText || '-',
        vendorC: vendors[2]?.priceText || '-',
        comment: '総額だけでなく内訳差も確認してください。',
      },
      {
        item: '工事項目',
        vendorA: vendors[0]?.headline || '-',
        vendorB: vendors[1]?.headline || '-',
        vendorC: vendors[2]?.headline || '-',
        comment: '工事項目の抜け漏れを確認してください。',
      },
      {
        item: '補足条件',
        vendorA: vendors[0]?.notes || '-',
        vendorB: vendors[1]?.notes || '-',
        vendorC: vendors[2]?.notes || '-',
        comment: '保証条件や施工範囲の違いに注意してください。',
      },
    ],
    comparisonComment:
      '各社の見積内容を比較すると、金額差だけでなく条件差の確認が必要です。',
    boardComment:
      '各社見積を比較したところ、金額のみでの判断は難しく、施工範囲と条件差を確認したうえで判断する必要があります。',
    bossComment:
      '見積比較を実施しました。金額差に加え、工事項目と条件差の確認が必要です。',
    vendorQuestionText:
      '見積条件について確認したくご連絡しました。施工範囲、保証条件、追加費用の有無をご教示ください。',
    recommendationMemo:
      `${firstVendor}を中心に検討しつつ、${secondVendor}との差分整理を進めてください。${thirdVendor ? `${thirdVendor}の条件差も確認が必要です。` : ''}`,
  }
}

export const buildEstimateComparisonFallbackResult =
  buildFallbackEstimateComparison