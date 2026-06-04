import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null

type HomeworkCandidate = {
  title: string
  detail: string
  recommendedType: 'task' | 'case'
}

type AgendaAiItem = {
  title: string
  text: string
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function extractJsonObject(text: string): Record<string, unknown> | null {
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
    try {
      const parsed = JSON.parse(trimmed.slice(firstBrace, lastBrace + 1))
      return isObject(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  return null
}

function normalizeHomeworkCandidates(raw: unknown): HomeworkCandidate[] {
  if (!Array.isArray(raw)) return []

  const normalized: HomeworkCandidate[] = []

  for (const item of raw) {
    const source = isObject(item) ? item : {}
    const title = safeString(source.title)

    if (!title) continue

    normalized.push({
      title,
      detail: safeString(source.detail),
      recommendedType:
        safeString(source.recommendedType) === 'case' ? 'case' : 'task',
    })
  }

  return normalized
}

function normalizeAgendaTitles(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []

  return raw.map((item) => safeString(item)).filter(Boolean)
}

function normalizeAgendaAiItems(
  raw: unknown,
  fallbackTitles: string[],
  transcript: string
): AgendaAiItem[] {
  const normalized: AgendaAiItem[] = []

  if (Array.isArray(raw) && raw.length > 0) {
    const maxLength = Math.max(raw.length, fallbackTitles.length)

    for (let index = 0; index < maxLength; index += 1) {
      const item = raw[index]
      const source = isObject(item) ? item : {}

      normalized.push({
        title:
          safeString(source.title) ||
          fallbackTitles[index] ||
          `第${index + 1}号議案`,
        text:
          safeString(source.text) ||
          buildFallbackAgendaText(
            fallbackTitles[index] || `第${index + 1}号議案`,
            transcript
          ),
      })
    }

    return normalized
  }

  for (let index = 0; index < fallbackTitles.length; index += 1) {
    normalized.push({
      title: fallbackTitles[index],
      text: buildFallbackAgendaText(fallbackTitles[index], transcript),
    })
  }

  return normalized
}

function buildFallbackAgendaText(title: string, transcript: string) {
  const compactTranscript = transcript
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 450)

  const approvalLine = /承認|可決|決議/.test(transcript)
    ? '議長が本議案の承認を諮ったところ、賛成多数で承認された。'
    : ''

  return `${title}について協議を行い、主な内容は ${compactTranscript || '文字起こし内容の確認中'} のとおりである。出席者間で現状、課題、今後の対応方針について確認し、必要な手配・連絡・整理を進めることとなった。${approvalLine}`
}

function buildFallbackHomework(transcript: string): HomeworkCandidate[] {
  const chunks = transcript
    .split(/\n|。|！|？/)
    .map((item) => item.trim())
    .filter(Boolean)

  const keywordMatched = chunks.filter((line) =>
    /(宿題|確認|対応|提出|手配|検討|依頼|次回|継続)/.test(line)
  )

  return keywordMatched.slice(0, 8).map((line, index) => ({
    title: `宿題候補 ${index + 1}`,
    detail: line,
    recommendedType: /工事|見積|業者|案件/.test(line) ? 'case' : 'task',
  }))
}

function composeMinutesText(items: AgendaAiItem[]) {
  return items
    .map((item) => `${item.title}\n${item.text}`)
    .join('\n\n')
}

function buildPrompt(params: {
  meetingType: string
  transcript: string
  propertyName: string
  caseTitle: string
  agendaTitles: string[]
}) {
  const agendaText = params.agendaTitles
    .map((title, index) => `${index + 1}. ${title}`)
    .join('\n')

  return `
あなたはマンション管理会社向けの議事録作成アシスタントです。
次の条件を守って、必ずJSONのみで返してください。
説明文、前置き、コードブロックは禁止です。

出力条件:
- 人が入力した議案タイトルをそのまま使う
- 各議案ごとに3〜6行程度の流れる文章で本文を書く
- 文体は議事録定型文調
- 必要なら決定事項と宿題事項を自然に入れる
- 議長承認の記載は、文字起こしに承認・可決の文脈がある時だけ入れる
- 宿題候補は短く、案件またはタスクに追加しやすく出す

返すJSONの形:
{
  "agendaItems": [
    {
      "title": "第1号議案 修繕積立金値上げ改定について",
      "text": "本文"
    }
  ],
  "homeworkCandidates": [
    {
      "title": "宿題タイトル",
      "detail": "宿題詳細",
      "recommendedType": "task"
    }
  ]
}

会議種別: ${params.meetingType}
物件名: ${params.propertyName || '未設定'}
案件名: ${params.caseTitle || '未設定'}

議案タイトル:
${agendaText}

文字起こし:
${params.transcript}
  `.trim()
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 })
    }

    const body = (await request.json()) as {
      meetingType?: string
      transcript?: string
      propertyName?: string
      caseTitle?: string
      agendaTitles?: string[]
    }

    const meetingType = safeString(body.meetingType) || '理事会'
    const transcript = safeString(body.transcript)
    const propertyName = safeString(body.propertyName)
    const caseTitle = safeString(body.caseTitle)
    const agendaTitles = normalizeAgendaTitles(body.agendaTitles)

    if (!transcript) {
      return NextResponse.json(
        { error: '文字起こしが空です。' },
        { status: 400 }
      )
    }

    if (agendaTitles.length === 0) {
      return NextResponse.json(
        { error: '議案タイトルが未入力です。' },
        { status: 400 }
      )
    }

    if (!openai) {
      const agendaItems = normalizeAgendaAiItems([], agendaTitles, transcript)

      return NextResponse.json({
        agendaItems,
        minutesText: composeMinutesText(agendaItems),
        homeworkCandidates: buildFallbackHomework(transcript),
      })
    }

    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MINUTES_MODEL ?? 'gpt-4.1-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'あなたはマンション管理会社向けの議事録JSONを返すアシスタントです。必ずJSONのみを返してください。',
          },
          {
            role: 'user',
            content: buildPrompt({
              meetingType,
              transcript,
              propertyName,
              caseTitle,
              agendaTitles,
            }),
          },
        ],
      })

      const content = completion.choices[0]?.message?.content ?? ''
      const parsed = extractJsonObject(content)

      if (!parsed) {
        throw new Error('AI応答をJSON解析できませんでした。')
      }

      const agendaItems = normalizeAgendaAiItems(
        parsed.agendaItems,
        agendaTitles,
        transcript
      )

      return NextResponse.json({
        agendaItems,
        minutesText: composeMinutesText(agendaItems),
        homeworkCandidates: normalizeHomeworkCandidates(
          parsed.homeworkCandidates
        ),
      })
    } catch (error) {
      console.error('ai/minutes/generate openai error', error)

      const agendaItems = normalizeAgendaAiItems([], agendaTitles, transcript)

      return NextResponse.json({
        agendaItems,
        minutesText: composeMinutesText(agendaItems),
        homeworkCandidates: buildFallbackHomework(transcript),
      })
    }
  } catch (error) {
    console.error('ai/minutes/generate route error', error)

    return NextResponse.json(
      { error: '議事録生成に失敗しました。' },
      { status: 500 }
    )
  }
}