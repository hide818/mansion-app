import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { extractJsonObject } from '@/lib/estimateComparison'

export const runtime = 'nodejs'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export type SelectedSection =
  | 'comparisonTable'
  | 'vendorSummaries'
  | 'priceDifference'
  | 'missingItems'
  | 'questionsToVendors'
  | 'boardComment'
  | 'agendaDraft'

const ALL_SECTIONS: SelectedSection[] = [
  'comparisonTable',
  'vendorSummaries',
  'priceDifference',
  'missingItems',
  'questionsToVendors',
  'boardComment',
  'agendaDraft',
]

type EstimateInput = {
  vendorName: string
  amountText?: string
  rawText: string
}

type ComparisonRow = {
  item: string
  values: { vendorName: string; value: string }[]
  note?: string
}

type VendorSummary = {
  vendorName: string
  totalAmount: string
  strengths: string[]
  concerns: string[]
}

export type EstimateComparisonResult = {
  overview: string
  comparisonRows: ComparisonRow[]
  vendorSummaries: VendorSummary[]
  cheapestVendor?: string
  priceDifferenceSummary: string
  missingItems: string[]
  questionsToVendors: string[]
  boardComment: string
  agendaDraft: string
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

function normalizeComparisonRows(value: unknown, allVendorNames: string[]): ComparisonRow[] {
  if (!Array.isArray(value)) return []
  return value
    .map((row) => {
      const source = isObject(row) ? row : {}
      const rawValues = Array.isArray(source.values)
        ? source.values
            .map((v: unknown) => {
              const vs = isObject(v) ? v : {}
              return { vendorName: safeString(vs.vendorName), value: safeString(vs.value) }
            })
            .filter((v) => v.vendorName)
        : allVendorNames.map((name) => ({ vendorName: name, value: '見積書上では確認できません' }))
      const note = safeString(source.note)
      return {
        item: safeString(source.item),
        values: rawValues,
        ...(note ? { note } : {}),
      }
    })
    .filter((row) => row.item)
}

function normalizeVendorSummaries(value: unknown): VendorSummary[] {
  if (!Array.isArray(value)) return []
  return value
    .map((vs) => {
      const source = isObject(vs) ? vs : {}
      return {
        vendorName: safeString(source.vendorName),
        totalAmount: safeString(source.totalAmount),
        strengths: safeStringArray(source.strengths),
        concerns: safeStringArray(source.concerns),
      }
    })
    .filter((vs) => vs.vendorName)
}

function sanitizeResult(
  raw: unknown,
  allVendorNames: string[]
): EstimateComparisonResult {
  const source = isObject(raw) ? raw : {}
  const cheapest = safeString(source.cheapestVendor)
  return {
    overview: safeString(source.overview),
    comparisonRows: normalizeComparisonRows(source.comparisonRows, allVendorNames),
    vendorSummaries: normalizeVendorSummaries(source.vendorSummaries),
    ...(cheapest ? { cheapestVendor: cheapest } : {}),
    priceDifferenceSummary: safeString(source.priceDifferenceSummary),
    missingItems: safeStringArray(source.missingItems),
    questionsToVendors: safeStringArray(source.questionsToVendors),
    boardComment: safeString(source.boardComment),
    agendaDraft: safeString(source.agendaDraft),
  }
}

function buildFallback(
  projectTitle: string,
  baseEstimateText: string,
  estimates: EstimateInput[]
): EstimateComparisonResult {
  const names = estimates.map((e) => e.vendorName)
  const baseLabel = baseEstimateText ? '基準見積あり（詳細は見積書を確認）' : '見積書上では確認できません'
  return {
    overview: `${projectTitle}について基準見積をもとに${names.join('・')}の見積を比較しました。金額・工事範囲・条件の詳細を確認のうえ、最終判断してください。`,
    comparisonRows: [
      {
        item: '見積総額',
        values: [
          { vendorName: '基準見積', value: baseLabel },
          ...estimates.map((e) => ({
            vendorName: e.vendorName,
            value: e.amountText || '見積書上では確認できません',
          })),
        ],
      },
      {
        item: '工事項目',
        values: [
          { vendorName: '基準見積', value: baseLabel },
          ...estimates.map((e) => ({ vendorName: e.vendorName, value: '見積書内容を確認してください' })),
        ],
      },
    ],
    vendorSummaries: estimates.map((e) => ({
      vendorName: e.vendorName,
      totalAmount: e.amountText || '見積書上では確認できません',
      strengths: ['詳細は見積書を確認してください'],
      concerns: ['基準見積との条件差を確認してください'],
    })),
    priceDifferenceSummary: '金額差の詳細はAI生成に失敗したため、手動で確認してください。',
    missingItems: ['保証条件', '支払条件', '工期'],
    questionsToVendors: [
      '基準見積と比較して変更・省略された項目を教えてください。',
      '追加工事が発生した場合の対応を教えてください。',
    ],
    boardComment: `${projectTitle}について基準見積をもとに複数社から見積を取得しました。各社の金額・工事範囲・保証条件等を比較のうえ、理事会での審議をお願いします。`,
    agendaDraft: `第〇号議案　${projectTitle}に関する業者選定について\n\n上記工事について基準見積をもとに複数社から見積を取得し、比較検討した結果を報告します。金額・仕様・保証条件等を総合的に判断し、施工業者を選定することを提案します。`,
  }
}

function buildPrompt(
  projectTitle: string,
  baseEstimateText: string,
  estimates: EstimateInput[],
  selectedSections: SelectedSection[]
): string {
  const has = (s: SelectedSection) => selectedSections.includes(s)

  const baseSection = `【基準見積（比較の軸・ユーザー確認済み）】\n${baseEstimateText || '（基準見積未入力）'}`

  const vendorSection = estimates
    .map((e, i) => {
      const lines = [
        `【業者${i + 1}：${e.vendorName}】`,
        e.amountText ? `金額メモ: ${e.amountText}` : '',
        '見積内容:',
        e.rawText || '（内容なし）',
      ]
      return lines.filter(Boolean).join('\n')
    })
    .join('\n\n')

  const valuesWithBase = [
    `{"vendorName": "基準見積", "value": "基準見積の該当内容（金額・仕様・数量等）"}`,
    ...estimates.map(
      (e) =>
        `{"vendorName": "${e.vendorName}", "value": "同等/差異あり（差分を具体的に）/項目なし/基準外追加項目/見積書上では確認できません"}`
    ),
  ].join(', ')

  const jsonFields: string[] = ['"overview": "総評。基準見積を軸にした全体概要を2〜4文で。"']

  if (has('comparisonTable')) {
    jsonFields.push(
      `"comparisonRows": [\n    {\n      "item": "比較項目（基準見積の項目順で。見積総額・工事項目・仕様・数量単価・保証・工期・除外項目・支払条件等）",\n      "values": [${valuesWithBase}],\n      "note": "各社差異の注目点（任意）"\n    }\n  ]`
    )
  }

  if (has('vendorSummaries')) {
    const vendorSummaryExample = estimates
      .map(
        (e) =>
          `{"vendorName": "${e.vendorName}", "totalAmount": "金額（税込・税抜の別を明記、不明は見積書上では確認できません）", "strengths": ["基準見積と比べた特長"], "concerns": ["基準見積と比べた懸念点"]}`
      )
      .join(', ')
    jsonFields.push(`"vendorSummaries": [${vendorSummaryExample}]`)
  }

  if (has('priceDifference')) {
    jsonFields.push('"cheapestVendor": "最も金額が低い業者名（判断できない場合は空文字）"')
    jsonFields.push('"priceDifferenceSummary": "基準見積との金額差および各社間の金額差の要点"')
  }

  if (has('missingItems')) {
    jsonFields.push('"missingItems": ["基準見積にある項目が不足している例1", "確認が必要な例2"]')
  }

  if (has('questionsToVendors')) {
    jsonFields.push(
      '"questionsToVendors": ["基準見積と比較して確認すべき質問1", "質問2"]'
    )
  }

  if (has('boardComment')) {
    jsonFields.push(
      '"boardComment": "理事会向けコメント（資料にそのまま貼れる文章。150〜300字程度。）"'
    )
  }

  if (has('agendaDraft')) {
    jsonFields.push('"agendaDraft": "総会議案に使える説明文（定型文調。100〜200字程度。）"')
  }

  const jsonFormat = `{\n  ${jsonFields.join(',\n  ')}\n}`

  return `工事名称: ${projectTitle}

${baseSection}

${vendorSection}

上記の内容を基に、以下のJSON形式で比較結果を返してください。
説明文・コードブロック・Markdown記法（**、##、- 等）は禁止です。
箇条書きが必要な場合はJSONの文字列値内で「・」を使ってください。

重要指示:
・比較表（comparisonRows）は基準見積の項目順で作成してください
・valuesの先頭は必ず {"vendorName": "基準見積", "value": "..."} にしてください
・各社見積にない項目は「項目なし」と記載してください
・確認できない内容は「見積書上では確認できません」と記載してください
・基準見積にない追加項目は備考に「基準外追加項目」として記載してください
・基準見積を絶対の正解とは断定せず、比較の軸として扱ってください

${jsonFormat}

注意事項:
・金額が税込か税抜か不明な場合はその旨を明記すること
・単純に最安値業者を推奨しないこと
・分譲マンション管理会社のフロント担当者向けの文体にすること
・回答は日本語で作成すること`
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.company_id) {
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
        { error: '基準見積の内容を入力または読み取ってください。' },
        { status: 400 }
      )
    }

    const rawSections = Array.isArray(body.selectedSections) ? body.selectedSections : []
    const selectedSections: SelectedSection[] = rawSections.filter(
      (s): s is SelectedSection =>
        typeof s === 'string' && ALL_SECTIONS.includes(s as SelectedSection)
    )

    if (selectedSections.length === 0) {
      return NextResponse.json(
        { error: '作成する内容を1つ以上選択してください。' },
        { status: 400 }
      )
    }

    const rawEstimates = Array.isArray(body.estimates) ? body.estimates : []

    if (rawEstimates.length < 1) {
      return NextResponse.json(
        { error: '比較対象の業者を1社以上入力してください。' },
        { status: 400 }
      )
    }

    const estimates: EstimateInput[] = rawEstimates.map((e: unknown) => {
      const source = isObject(e) ? e : {}
      const amountText = safeString(source.amountText)
      return {
        vendorName: safeString(source.vendorName),
        ...(amountText ? { amountText } : {}),
        rawText: safeString(source.rawText),
      }
    })

    const hasEmptyField = estimates.some((e) => !e.vendorName || !e.rawText)
    if (hasEmptyField) {
      return NextResponse.json(
        { error: '全ての業者の名称と見積内容を入力してください。' },
        { status: 400 }
      )
    }

    // allVendorNames includes "基準見積" as first entry for comparisonRows fallback
    const allVendorNames = ['基準見積', ...estimates.map((e) => e.vendorName)]
    let result: EstimateComparisonResult = buildFallback(projectTitle, baseEstimateText, estimates)
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
                '分譲マンション管理会社のフロント担当者を補助する見積比較表作成AIです。基準見積を軸に各社見積を比較します。必ずJSONのみを返してください。',
            },
            {
              role: 'user',
              content: buildPrompt(projectTitle, baseEstimateText, estimates, selectedSections),
            },
          ],
        })

        const aiText = completion.choices[0]?.message?.content ?? ''
        const parsed = extractJsonObject(aiText)

        if (parsed) {
          result = sanitizeResult(parsed, allVendorNames)
          aiUsed = true
        }
      } catch (err) {
        console.error('estimate-comparison openai error', err)
      }
    }

    return NextResponse.json({ ok: true, result, aiUsed })
  } catch (err) {
    console.error('estimate-comparison route error', err)
    return NextResponse.json(
      { error: 'AI見積比較の実行に失敗しました。' },
      { status: 500 }
    )
  }
}
