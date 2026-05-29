import OpenAI from 'openai'
import type { MeetingType } from './audioTranscription'

type GenerateMinutesParams = {
  transcript: string
  meetingType?: unknown
}

type GenerateMinutesResult = {
  minutes: string
  title: string
  agendaCount: number
  model: string
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY が未設定です。')
  }

  return new OpenAI({ apiKey })
}

function normalizeMeetingType(value: unknown): MeetingType {
  if (
    value === '理事会' ||
    value === '総会' ||
    value === '修繕委員会' ||
    value === '打合せ'
  ) {
    return value
  }

  return '理事会'
}

export function getMeetingDocumentTitle(meetingType: MeetingType) {
  switch (meetingType) {
    case '理事会':
      return '理事会議事録'
    case '総会':
      return '総会議事録'
    case '修繕委員会':
      return '修繕委員会議事録'
    case '打合せ':
      return '打合せ記録'
    default:
      return '理事会議事録'
  }
}

function stripMarkdownHeading(text: string) {
  return text.replace(/^\s*#{1,6}\s*/gm, '').trim()
}

function normalizeMinutesText(text: string) {
  return stripMarkdownHeading(
    text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
  )
}

function countAgendaItems(text: string) {
  const matches = text.match(/第\s*\d+\s*号(?:議案|議題)/g)
  return matches ? matches.length : 0
}

function buildMinutesInstruction(meetingType: MeetingType) {
  const title = getMeetingDocumentTitle(meetingType)

  return [
    'あなたはマンション管理会社向けの実務用議事録作成アシスタントです。',
    `以下の文字起こしをもとに、日本語で実務向けの${title}を作成してください。`,
    '',
    '必須ルール:',
    `- 1行目は必ず「${title}」とする`,
    '- Markdown記号（#, ##, ###, -, *）は使わない',
    '- 見出しは「第1号議案」「第2号議案」のように統一する',
    '- 各議案は、見出しを含めて3行以上6行以内でまとめる',
    '- 一議案一議案を、わかりやすく簡潔に書く',
    '- 長文にしない',
    '- 同じ説明を繰り返さない',
    '- 実務担当者がパッと読んで分かる短さを優先する',
    '- 1行ごとに意味が分かるように自然な文章で書く',
    '- 承認を諮った議案については、最後の行を必ず承認結果の文で締める',
    '- 承認結果の文は「議長が本議案の承認を諮ったところ、賛成多数で承認された。」または「議長が本議案の承認を諮ったところ、反対多数で否決された。」のような形に統一する',
    '- 承認を諮っていない議案には、その文を書かない',
    '- 決議結果が不明な場合は、勝手に承認・否決を断定しない',
    '- 最後の「全体の宿題事項」「確認要事項」も簡潔にまとめる',
    '- 不明な点を勝手に断定しない',
    '',
    '文字起こし:',
  ].join('\n')
}

export async function generateAiMinutes(
  params: GenerateMinutesParams,
): Promise<GenerateMinutesResult> {
  const client = getOpenAIClient()

  const transcript = String(params.transcript || '').trim()
  const meetingType = normalizeMeetingType(params.meetingType)
  const title = getMeetingDocumentTitle(meetingType)
  const model = process.env.OPENAI_MINUTES_MODEL || 'gpt-5.4'

  if (!transcript) {
    throw new Error('議事録生成に必要な文字起こしが空です。')
  }

  const response = await client.responses.create({
    model,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: buildMinutesInstruction(meetingType),
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: transcript,
          },
        ],
      },
    ],
  })

  const minutes = normalizeMinutesText(response.output_text || '')

  if (!minutes) {
    throw new Error('議事録の生成結果が空でした。')
  }

  return {
    minutes,
    title,
    agendaCount: countAgendaItems(minutes),
    model,
  }
}