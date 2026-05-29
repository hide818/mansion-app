import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { promises as fs } from 'node:fs'
import { createReadStream } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

export const runtime = 'nodejs'

const execFileAsync = promisify(execFile)

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const CHUNK_SECONDS = 20 * 60

type ExtractedActionItem = {
  id: string
  title: string
  description: string
  recommendedType: 'task' | 'case'
}

function normalizeAgendaTitles(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []

  return raw
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0)
}

function splitParagraphLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function normalizeForCompare(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

function dedupeAgendaBlocks(text: string) {
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (!normalized) return ''

  const blocks = normalized
    .split(/\n(?=第[0-9０-９一二三四五六七八九十]+号議案)/)
    .map((block) => block.trim())
    .filter(Boolean)

  const unique: string[] = []
  const seen = new Set<string>()

  for (const block of blocks) {
    const key = normalizeForCompare(block)
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(block)
  }

  return unique.join('\n\n').trim()
}

function compressAgendaBodyLines(text: string, maxLines = 4) {
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (!normalized) return ''

  const blocks = normalized
    .split(/\n(?=第[0-9０-９一二三四五六七八九十]+号議案)/)
    .map((block) => block.trim())
    .filter(Boolean)

  const compressedBlocks = blocks.map((block) => {
    const lines = splitParagraphLines(block)
    if (lines.length <= 1) return block

    const title = lines[0]
    const bodyLines = lines.slice(1)

    if (bodyLines.length <= maxLines) {
      return [title, ...bodyLines].join('\n')
    }

    const shortenedBody = bodyLines.slice(0, maxLines)
    return [title, ...shortenedBody].join('\n')
  })

  return compressedBlocks.join('\n\n').trim()
}

function sanitizeOutput(text: string) {
  const cleaned = text
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/```+/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const deduped = dedupeAgendaBlocks(cleaned)
  return compressAgendaBodyLines(deduped, 4)
}

function buildMinutesPrompt(params: {
  meetingType: '総会' | '理事会'
  propertyName: string
  agendas: string[]
  transcript: string
}) {
  const { meetingType, propertyName, agendas, transcript } = params

  const agendaText = agendas
    .map((title, index) => `${index + 1}. ${title}`)
    .join('\n')

  const closingRule =
    meetingType === '総会'
      ? '各議案の最終行は必ず「議長が本議案について承認を諮ったところ、賛成多数で承認された。」で統一すること。'
      : '理事会の場合は、承認が明確でない議題に無理に承認文を入れないこと。'

  return `
あなたはマンション管理会社向けの議事録作成アシスタントです。
以下のルールを厳守して、日本語で実務向けの簡潔な議事録を作成してください。

【絶対ルール】
- 登録済みの議題名は変更しないこと
- 議題番号を作り直さないこと
- 出力はプレーンテキストのみ
- #、##、### などの記号は一切出力しないこと
- Markdown記法を使わないこと
- コードブロックを使わないこと
- 同じ議案を繰り返し出力しないこと
- 各議案は1回だけ出力すること
- 他の議案の内容を混在させないこと
- わからない内容は膨らませないこと
- 数値や内訳は重要なものだけ残し、細かい説明は削ること
- 冗長な背景説明は禁止
- 実務でさっと読める長さにすること

【長さルール】
- 1議案あたり本文は3文から4文まで
- 5文以上は禁止
- 改行は本文1文ごとに1行とすること
- 見出し1行 + 本文3〜4行で収めること

【内容ルール】
- 本文は「何を報告・審議したか」「重要な補足」「結論」が伝われば十分
- 枝葉の話、細かい会計説明、長い背景説明は削ること
- 文章は総会議事録らしい簡潔な定型文調にすること

【会議情報】
会議種別: ${meetingType}
マンション名: ${propertyName}

【登録済み議題】
${agendaText}

【会議種別ごとの追加ルール】
${closingRule}

【出力形式】
第1号議案
1文目
2文目
3文目
4文目

第2号議案
1文目
2文目
3文目
4文目

のように、各議案ごとに空行を1つ空けて出力すること。

【文字起こし全文】
${transcript}
`.trim()
}

function buildActionItemsPrompt(params: {
  meetingType: '総会' | '理事会'
  propertyName: string
  transcript: string
  minutes: string
}) {
  const { meetingType, propertyName, transcript, minutes } = params

  return `
あなたはマンション管理会社向けの実務アシスタントです。
会議の文字起こしと議事録から、あとで対応が必要な宿題だけを抽出してください。

【ルール】
- 日本語で出力すること
- 最大10件まで
- 宿題が無ければ空の配列を返すこと
- 各項目は title, description, recommendedType を持つこと
- recommendedType は "task" または "case" のどちらか
- 単発の軽作業なら task
- 継続管理や業者調整、理事会報告待ち、工事対応などは case
- title は短くわかりやすく
- description は何をするかが分かる1〜2文
- 出力はJSONのみ
- Markdown禁止
- \`\`\` 禁止

【会議情報】
会議種別: ${meetingType}
マンション名: ${propertyName}

【議事録】
${minutes}

【文字起こし全文】
${transcript}

【出力形式】
[
  {
    "title": "業者へ見積依頼",
    "description": "立体駐車場補修について、複数業者へ見積依頼を行う。",
    "recommendedType": "case"
  }
]
`.trim()
}

function extractErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null) {
    const maybeError = error as {
      message?: unknown
      error?: unknown
      status?: unknown
      code?: unknown
    }

    if (typeof maybeError.message === 'string' && maybeError.message.trim()) {
      const text = maybeError.message

      if (text.includes('audio duration') && text.includes('longer than')) {
        return '音声が長いため分割処理が必要ですが、内部処理で失敗しました。'
      }

      return text
    }

    if (typeof maybeError.error === 'string' && maybeError.error.trim()) {
      return maybeError.error
    }

    const parts = [
      typeof maybeError.status === 'number' ? `status=${maybeError.status}` : '',
      typeof maybeError.code === 'string' ? `code=${maybeError.code}` : '',
    ].filter(Boolean)

    if (parts.length > 0) {
      return `APIエラー: ${parts.join(', ')}`
    }
  }

  return '議事録の作成中にエラーが発生しました。'
}

function getSafeExtension(filename: string) {
  const ext = path.extname(filename).toLowerCase()
  const allowed = new Set([
    '.mp3',
    '.mp4',
    '.mpeg',
    '.mpga',
    '.m4a',
    '.wav',
    '.webm',
  ])

  if (allowed.has(ext)) return ext
  return '.m4a'
}

async function ensureFfmpegAvailable() {
  try {
    await execFileAsync('ffmpeg', ['-version'])
  } catch {
    throw new Error(
      'ffmpeg が見つかりません。Macのターミナルで brew install ffmpeg を実行してください。',
    )
  }
}

async function splitAudioToMp3Chunks(inputPath: string, outputDir: string) {
  await fs.mkdir(outputDir, { recursive: true })

  const outputPattern = path.join(outputDir, 'chunk-%03d.mp3')

  await execFileAsync('ffmpeg', [
    '-i',
    inputPath,
    '-vn',
    '-ac',
    '1',
    '-ar',
    '16000',
    '-c:a',
    'libmp3lame',
    '-b:a',
    '64k',
    '-f',
    'segment',
    '-segment_time',
    String(CHUNK_SECONDS),
    '-reset_timestamps',
    '1',
    outputPattern,
    '-y',
  ])

  const files = await fs.readdir(outputDir)
  const chunkPaths = files
    .filter((file) => file.endsWith('.mp3'))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => path.join(outputDir, file))

  if (chunkPaths.length === 0) {
    throw new Error('音声の分割に失敗しました。')
  }

  return chunkPaths
}

async function transcribeChunks(chunkPaths: string[]) {
  const transcripts: string[] = []

  for (const chunkPath of chunkPaths) {
    const transcription = await client.audio.transcriptions.create({
      file: createReadStream(chunkPath),
      model: 'gpt-4o-transcribe',
      language: 'ja',
    })

    const text = transcription.text?.trim() ?? ''
    if (text) {
      transcripts.push(text)
    }
  }

  return transcripts.join('\n')
}

function safeJsonParseArray(text: string): ExtractedActionItem[] {
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  const parsed = JSON.parse(cleaned)

  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed
    .map((item, index) => {
      const title =
        typeof item?.title === 'string' ? item.title.trim() : ''
      const description =
        typeof item?.description === 'string' ? item.description.trim() : ''
      const recommendedType =
        item?.recommendedType === 'case' ? 'case' : 'task'

      if (!title) {
        return null
      }

      return {
        id: `action-${index + 1}`,
        title,
        description,
        recommendedType,
      } satisfies ExtractedActionItem
    })
    .filter((item): item is ExtractedActionItem => item !== null)
}

async function extractActionItems(params: {
  meetingType: '総会' | '理事会'
  propertyName: string
  transcript: string
  minutes: string
}) {
  const prompt = buildActionItemsPrompt(params)

  const response = await client.responses.create({
    model: 'gpt-5.4',
    input: prompt,
    reasoning: {
      effort: 'none',
    },
    text: {
      verbosity: 'low',
    },
  })

  const text = response.output_text ?? ''
  return safeJsonParseArray(text)
}

async function removeDirectorySilently(targetPath: string) {
  try {
    await fs.rm(targetPath, { recursive: true, force: true })
  } catch {
    // noop
  }
}

export async function POST(request: Request) {
  const workDir = path.join(os.tmpdir(), `ai-minutes-${randomUUID()}`)
  const uploadDir = path.join(workDir, 'upload')
  const chunkDir = path.join(workDir, 'chunks')

  try {
    const formData = await request.formData()

    const meetingTypeRaw = String(formData.get('meetingType') ?? '').trim()
    const propertyName = String(formData.get('propertyName') ?? '').trim()
    const agendasRaw = String(formData.get('agendas') ?? '[]')
    const audio = formData.get('audio')

    const meetingType =
      meetingTypeRaw === '理事会' ? '理事会' : '総会'

    let parsedAgendas: unknown = []
    try {
      parsedAgendas = JSON.parse(agendasRaw)
    } catch {
      return NextResponse.json(
        { error: '議題データの形式が不正です。' },
        { status: 400 },
      )
    }

    const agendas = normalizeAgendaTitles(parsedAgendas)

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY が未設定です。.env.local を確認してください。' },
        { status: 500 },
      )
    }

    if (!propertyName) {
      return NextResponse.json(
        { error: 'マンション名を入力してください。' },
        { status: 400 },
      )
    }

    if (agendas.length === 0) {
      return NextResponse.json(
        { error: '議題を1つ以上入力してください。' },
        { status: 400 },
      )
    }

    if (!(audio instanceof File)) {
      return NextResponse.json(
        { error: '音声ファイルを選択してください。' },
        { status: 400 },
      )
    }

    if (audio.size === 0) {
      return NextResponse.json(
        { error: '音声ファイルが空です。別のファイルを選択してください。' },
        { status: 400 },
      )
    }

    await ensureFfmpegAvailable()

    await fs.mkdir(uploadDir, { recursive: true })

    const extension = getSafeExtension(audio.name)
    const inputPath = path.join(uploadDir, `source${extension}`)
    const arrayBuffer = await audio.arrayBuffer()
    await fs.writeFile(inputPath, Buffer.from(arrayBuffer))

    const chunkPaths = await splitAudioToMp3Chunks(inputPath, chunkDir)
    const transcriptText = (await transcribeChunks(chunkPaths)).trim()

    if (!transcriptText) {
      return NextResponse.json(
        { error: '文字起こし結果が空でした。音声ファイルを確認してください。' },
        { status: 400 },
      )
    }

    const minutesPrompt = buildMinutesPrompt({
      meetingType,
      propertyName,
      agendas,
      transcript: transcriptText,
    })

    const minutesResponse = await client.responses.create({
      model: 'gpt-5.4',
      input: minutesPrompt,
      reasoning: {
        effort: 'none',
      },
      text: {
        verbosity: 'low',
      },
    })

    const minutes = sanitizeOutput(minutesResponse.output_text ?? '')

    if (!minutes) {
      return NextResponse.json(
        { error: '議事録の生成結果が空でした。' },
        { status: 500 },
      )
    }

    const actionItems = await extractActionItems({
      meetingType,
      propertyName,
      transcript: transcriptText,
      minutes,
    })

    return NextResponse.json({
      transcript: transcriptText,
      minutes,
      actionItems,
    })
  } catch (error) {
    console.error('AI minutes route error:', error)

    return NextResponse.json(
      { error: extractErrorMessage(error) },
      { status: 500 },
    )
  } finally {
    await removeDirectorySilently(workDir)
  }
}