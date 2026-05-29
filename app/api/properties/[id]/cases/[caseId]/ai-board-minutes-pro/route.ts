import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import {
  extractSectionItemsFromText,
  mergeBoardMinutesFormattingOptions,
  type BoardMinutesGenerationResult,
} from '@/lib/boardMinutesShared'
import type { MeetingType } from '@/lib/boardMinutesRecords'

export const runtime = 'nodejs'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

type RouteContext = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

type ServerSupabase = Awaited<ReturnType<typeof createSupabaseServerClient>>

function normalizeMeetingType(value: unknown): MeetingType {
  if (value === 'board' || value === 'general' || value === 'meeting') {
    return value
  }

  return 'board'
}

function safeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function sanitizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}

function extractJsonObject(text: string) {
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null
  }

  const sliced = text.slice(firstBrace, lastBrace + 1)

  try {
    return JSON.parse(sliced) as Record<string, unknown>
  } catch {
    return null
  }
}

function buildSystemPrompt() {
  return `
あなたはマンション管理会社の実務に強い、議事録作成専門AIです。
出力は必ずJSONのみで返してください。説明文は禁止です。

絶対ルール:
- minutesText は日本語の議事録本文のみ
- Markdown記号の見出し（#, ##, ###）は禁止
- 議案見出しは「第1号議案 〇〇」の形式
- 各議案は、見出し込みで3行以上6行以内
- 一議案ごとに簡潔で分かりやすくまとめる
- 文体は議事録定型文調
- 文章は流れる文章で書く
- 決定事項・宿題事項は各議案の中に自然に入れる
- 承認を諮ったことが読み取れる議案のみ、末尾を次の定型に寄せる
  「議長が本議案の承認を諮ったところ、賛成多数で承認された。」
  または
  「議長が本議案の承認を諮ったところ、反対多数で否決された。」
- 承認を諮っていない、または不明な場合は承認文を書かない
- 固有名詞や数字は、文字起こしに根拠がある範囲でのみ使う
- 本文の最後に必ず以下2セクションを入れる
  1. 全体の宿題事項
  2. 全体の確認要事項
- 宿題事項や確認要事項がなければ「・特になし」と書く

JSON schema:
{
  "minutesTitle": "string",
  "minutesText": "string",
  "actionItems": ["string"],
  "confirmationItems": ["string"]
}
`.trim()
}

function buildUserPrompt(input: {
  meetingType: MeetingType
  meetingName: string
  transcriptText: string
  supplementNote: string
  caseTitle: string
  formattingText: string
}) {
  const meetingTypeLabel =
    input.meetingType === 'board'
      ? '理事会'
      : input.meetingType === 'general'
      ? '総会'
      : '打合せ'

  return `
会議種別: ${meetingTypeLabel}
会議名: ${input.meetingName || '未入力'}
案件名: ${input.caseTitle || '未設定'}
書式指定:
${input.formattingText}

補足メモ:
${input.supplementNote || 'なし'}

文字起こし全文:
${input.transcriptText}

上記をもとに、実務でそのまま使いやすい議事録を作成してください。
minutesTitle は自然な会議タイトルにしてください。
actionItems には「全体の宿題事項」を配列で入れてください。
confirmationItems には「全体の確認要事項」を配列で入れてください。
`.trim()
}

function buildFormattingText(value: ReturnType<typeof mergeBoardMinutesFormattingOptions>) {
  return [
    `文体: ${value.tone}`,
    `見出し: ${value.headingStyle}`,
    `粒度: ${value.detailLevel}`,
    `文章の出し方: ${value.proseStyle}`,
    `決定事項・宿題事項: ${value.decisionRule}`,
    `定型表現ルール: ${value.phraseRule}`,
  ].join('\n')
}

function buildFallbackResult(input: {
  meetingType: MeetingType
  meetingName: string
  transcriptText: string
  supplementNote: string
}) {
  const title =
    input.meetingName ||
    (input.meetingType === 'board'
      ? '理事会議事録'
      : input.meetingType === 'general'
      ? '総会議事録'
      : '打合せ議事録')

  const fallbackMinutesText = [
    title,
    '',
    '第1号議案 会議内容の整理',
    '管理会社から、会議全体の内容について説明がなされ、文字起こし内容をもとに主な論点及び対応事項の整理が行われた。',
    'また、今後の対応方針、確認が必要な事項及び関係者との調整事項について確認がなされた。',
    input.supplementNote
      ? `なお、補足メモとして「${input.supplementNote}」を踏まえて文案整理を行うこととした。`
      : 'なお、詳細な表現や固有名詞については原文との照合を行い、必要に応じて補正することとした。',
    '',
    '全体の宿題事項',
    '・文字起こし全文を再確認し、必要な対応事項を整理すること。',
    '',
    '全体の確認要事項',
    '・固有名詞、数字及び承認有無の表現を最終確認すること。',
  ].join('\n')

  return {
    minutesTitle: title,
    minutesText: fallbackMinutesText,
    actionItems: ['文字起こし全文を再確認し、必要な対応事項を整理すること。'],
    confirmationItems: ['固有名詞、数字及び承認有無の表現を最終確認すること。'],
  }
}

async function resolveCurrentCompanyId(supabase: ServerSupabase) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    throw new Error('ログイン情報が取得できません。')
  }

  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    throw profileError
  }

  if (!profileRow?.company_id) {
    throw new Error('company_id が取得できません。')
  }

  return profileRow.company_id as string
}

async function ensureScopedCase(
  supabase: ServerSupabase,
  companyId: string,
  propertyId: string,
  caseId: string
) {
  const { data: propertyRow, error: propertyError } = await supabase
    .from('properties')
    .select('id, name')
    .eq('id', propertyId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (propertyError) {
    throw propertyError
  }

  if (!propertyRow) {
    return null
  }

  const { data: caseRow, error: caseError } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .eq('property_id', propertyId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (caseError) {
    throw caseError
  }

  if (!caseRow) {
    return null
  }

  return {
    propertyRow,
    caseRow,
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY が設定されていません。' },
        { status: 500 }
      )
    }

    const supabase = await createSupabaseServerClient()
    const { id: propertyId, caseId } = await context.params
    const companyId = await resolveCurrentCompanyId(supabase)

    const scoped = await ensureScopedCase(supabase, companyId, propertyId, caseId)

    if (!scoped) {
      return NextResponse.json(
        { error: '対象の物件または案件が見つかりません。' },
        { status: 404 }
      )
    }

    const body = await request.json()

    const meetingType = normalizeMeetingType(body.meetingType)
    const meetingName = safeText(body.meetingName)
    const transcriptText = safeText(body.transcriptText)
    const supplementNote = safeText(body.supplementNote)
    const formattingApplied = mergeBoardMinutesFormattingOptions(
      body.formattingOptions
    )

    if (!transcriptText) {
      return NextResponse.json(
        { error: '文字起こし全文を入れてください。' },
        { status: 400 }
      )
    }

    const caseTitle =
      typeof scoped.caseRow?.title === 'string' ? scoped.caseRow.title.trim() : ''

    const systemPrompt = buildSystemPrompt()
    const userPrompt = buildUserPrompt({
      meetingType,
      meetingName,
      transcriptText,
      supplementNote,
      caseTitle,
      formattingText: buildFormattingText(formattingApplied),
    })

    let parsedResult: BoardMinutesGenerationResult | null = null

    try {
      const response = await openai.responses.create({
        model: 'gpt-5.4-mini',
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: systemPrompt }],
          },
          {
            role: 'user',
            content: [{ type: 'input_text', text: userPrompt }],
          },
        ],
      })

      const outputText = response.output_text?.trim() || ''
      const parsedJson = extractJsonObject(outputText)

      if (parsedJson) {
        const minutesTitle =
          typeof parsedJson.minutesTitle === 'string' &&
          parsedJson.minutesTitle.trim()
            ? parsedJson.minutesTitle.trim()
            : meetingName ||
              (meetingType === 'board'
                ? '理事会議事録'
                : meetingType === 'general'
                ? '総会議事録'
                : '打合せ議事録')

        const minutesText =
          typeof parsedJson.minutesText === 'string' &&
          parsedJson.minutesText.trim()
            ? parsedJson.minutesText.trim()
            : ''

        const actionItems = sanitizeStringArray(parsedJson.actionItems)
        const confirmationItems = sanitizeStringArray(parsedJson.confirmationItems)

        if (minutesText) {
          parsedResult = {
            minutesTitle,
            minutesText,
            actionItems:
              actionItems.length > 0
                ? actionItems
                : extractSectionItemsFromText(minutesText, [
                    '全体の宿題事項',
                    '宿題事項',
                  ]),
            confirmationItems:
              confirmationItems.length > 0
                ? confirmationItems
                : extractSectionItemsFromText(minutesText, [
                    '全体の確認要事項',
                    '確認要事項',
                  ]),
            formattingApplied,
          }
        }
      }
    } catch {
      parsedResult = null
    }

    if (!parsedResult) {
      const fallback = buildFallbackResult({
        meetingType,
        meetingName,
        transcriptText,
        supplementNote,
      })

      parsedResult = {
        minutesTitle: fallback.minutesTitle,
        minutesText: fallback.minutesText,
        actionItems: fallback.actionItems,
        confirmationItems: fallback.confirmationItems,
        formattingApplied,
      }
    }

    if (parsedResult.actionItems.length === 0) {
      parsedResult.actionItems = ['特になし']
    }

    if (parsedResult.confirmationItems.length === 0) {
      parsedResult.confirmationItems = ['特になし']
    }

    return NextResponse.json(parsedResult)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '不明なエラーが発生しました。'

    return NextResponse.json(
      { error: 'AI議事録の生成に失敗しました。', detail: message },
      { status: 500 }
    )
  }
}