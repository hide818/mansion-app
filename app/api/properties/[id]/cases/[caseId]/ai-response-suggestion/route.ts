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
      toolTitle: 'AI対応提案',
      instruction: `以下の形式で出力してください。

【今の案件判断】
1段落

【優先して進める対応】
・5件

【相手待ちを減らすための打ち手】
・3件

【社長や上司に共有する要点】
・3件

条件:
- 実務でそのまま動ける内容にする
- 抽象論は禁止
- ログとタスクの現状を踏まえる`,
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
      { error: 'AI対応提案に失敗しました。' },
      { status: 500 }
    )
  }
}