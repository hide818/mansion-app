import { Buffer } from 'node:buffer'
import { NextResponse } from 'next/server'
import { transcribeMeetingAudio } from '@/lib/audioTranscription'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type JsonBody = {
  meetingType?: string
  fileName?: string
  mimeType?: string
  base64?: string
}

function getMeetingType(value: unknown) {
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

function guessMimeType(fileName: string, mimeType?: string) {
  if (mimeType && mimeType.trim()) {
    return mimeType
  }

  const lowerName = fileName.toLowerCase()

  if (lowerName.endsWith('.m4a')) return 'audio/mp4'
  if (lowerName.endsWith('.mp4')) return 'video/mp4'
  if (lowerName.endsWith('.mp3')) return 'audio/mpeg'
  if (lowerName.endsWith('.wav')) return 'audio/wav'
  if (lowerName.endsWith('.webm')) return 'audio/webm'
  if (lowerName.endsWith('.oga')) return 'audio/ogg'
  if (lowerName.endsWith('.ogg')) return 'audio/ogg'

  return 'application/octet-stream'
}

function cleanBase64(base64: string) {
  return base64.includes(',') ? base64.split(',')[1] || '' : base64
}

export async function POST(request: Request) {
  try {
    const contentType = (request.headers.get('content-type') || '').toLowerCase()

    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        {
          ok: false,
          error:
            '送信方式が古いままです。ページを再読み込みして、もう一度お試しください。',
        },
        { status: 400 },
      )
    }

    const body = (await request.json()) as JsonBody

    const meetingType = getMeetingType(body.meetingType)
    const fileName =
      String(body.fileName || 'meeting-audio.m4a').trim() || 'meeting-audio.m4a'
    const mimeType = guessMimeType(fileName, body.mimeType)
    const base64 = cleanBase64(String(body.base64 || '').trim())

    if (!base64) {
      return NextResponse.json(
        {
          ok: false,
          error: '音声データが空です。ファイルを選び直してください。',
        },
        { status: 400 },
      )
    }

    let buffer: Buffer

    try {
      buffer = Buffer.from(base64, 'base64')
    } catch (error) {
      console.error('ai-transcribe base64 decode error:', error)

      return NextResponse.json(
        {
          ok: false,
          error: '音声データの変換に失敗しました。',
        },
        { status: 400 },
      )
    }

    if (!buffer.length) {
      return NextResponse.json(
        {
          ok: false,
          error: '音声データが空です。ファイルを選び直してください。',
        },
        { status: 400 },
      )
    }

    const file = new File([new Uint8Array(buffer)], fileName, {
      type: mimeType,
      lastModified: Date.now(),
    })

    const { transcript, model } = await transcribeMeetingAudio({
      file,
      meetingType,
    })

    return NextResponse.json({
      ok: true,
      transcript,
      meetingType,
      model,
      fileName,
      mimeType,
      transport: 'json-base64',
    })
  } catch (error) {
    console.error('ai-transcribe route error:', error)

    const message =
      error instanceof Error
        ? error.message
        : '文字起こし中に不明なエラーが発生しました。'

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    )
  }
}