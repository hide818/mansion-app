import OpenAI from 'openai'

export type MeetingType = '理事会' | '総会' | '修繕委員会' | '打合せ'

type TranscriptionResult = {
  transcript: string
  model: string
}

type TranscriptionModel =
  | 'gpt-4o-mini-transcribe'
  | 'gpt-4o-transcribe'
  | 'whisper-1'

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

function normalizeTranscriptText(value: string) {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractTranscriptText(result: unknown) {
  if (typeof result === 'string') {
    return normalizeTranscriptText(result)
  }

  if (result && typeof result === 'object' && 'text' in result) {
    const text = (result as { text?: string }).text || ''
    return normalizeTranscriptText(text)
  }

  return ''
}

function isTokenBudgetError(error: unknown) {
  const message =
    error instanceof Error ? error.message : String(error || '')

  const normalized = message.toLowerCase()

  return (
    normalized.includes('instructions + audio is too large') ||
    normalized.includes('total number of tokens') ||
    normalized.includes('too large for this model')
  )
}

async function transcribeWithModel(params: {
  client: OpenAI
  file: File
  model: TranscriptionModel
}) {
  const result = await params.client.audio.transcriptions.create({
    file: params.file,
    model: params.model,
    response_format: 'json',
  })

  const transcript = extractTranscriptText(result)

  if (!transcript) {
    throw new Error('文字起こし結果が空でした。')
  }

  return transcript
}

export async function transcribeMeetingAudio(params: {
  file: File
  meetingType?: unknown
}): Promise<TranscriptionResult> {
  const client = getOpenAIClient()
  const file = params.file
  normalizeMeetingType(params.meetingType)

  const primaryModel =
    (process.env.OPENAI_TRANSCRIBE_MODEL as TranscriptionModel | undefined) ||
    'gpt-4o-mini-transcribe'

  const fallbackModel =
    (process.env.OPENAI_TRANSCRIBE_FALLBACK_MODEL as TranscriptionModel | undefined) ||
    'whisper-1'

  if (!file) {
    throw new Error('音声ファイルがありません。')
  }

  try {
    const transcript = await transcribeWithModel({
      client,
      file,
      model: primaryModel,
    })

    return {
      transcript,
      model: primaryModel,
    }
  } catch (error) {
    if (!isTokenBudgetError(error) || primaryModel === fallbackModel) {
      throw error
    }

    const transcript = await transcribeWithModel({
      client,
      file,
      model: fallbackModel,
    })

    return {
      transcript,
      model: fallbackModel,
    }
  }
}