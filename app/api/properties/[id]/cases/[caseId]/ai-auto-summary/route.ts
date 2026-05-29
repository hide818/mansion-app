import { NextResponse } from 'next/server'
import { generateCaseAiText } from '@/lib/caseAiTools'

type RouteContext = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export async function POST(_: Request, context: RouteContext) {
  try {
    const { id, caseId } = await context.params

    const text = await generateCaseAiText({
      propertyId: id,
      caseId,
      toolTitle: 'AI案件自動要約',
      instruction: `以下の形式で出力してください。

【案件の要点】
1段落

【今の状況】
1段落

【未完了タスクの整理】
箇条書き

【注意点】
箇条書き

【次にやること】
箇条書き

条件:
- 社内で引き継ぎや共有に使える文にする
- 余計な前置きは禁止
- 日本語で簡潔に`,
    })

    return NextResponse.json({ text })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'AI生成に失敗しました。'

    if (message === 'NOT_FOUND') {
      return NextResponse.json(
        { error: '案件が見つかりません。' },
        { status: 404 }
      )
    }

    if (message === 'OPENAI_API_KEY_MISSING') {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY が未設定です。' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'AI案件自動要約に失敗しました。' },
      { status: 500 }
    )
  }
}