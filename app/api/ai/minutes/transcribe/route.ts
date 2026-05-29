import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null

export async function POST(request: NextRequest) {
  try {
    if (!openai) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY が未設定です。' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: '音声ファイルが見つかりません。' },
        { status: 400 }
      )
    }

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'ja',
    })

    return NextResponse.json({
      text: transcription.text ?? '',
    })
  } catch (error) {
    console.error('ai/minutes/transcribe error', error)

    return NextResponse.json(
      { error: '文字起こしに失敗しました。' },
      { status: 500 }
    )
  }
}