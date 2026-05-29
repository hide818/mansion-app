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
      toolTitle: 'AI類似案件提案',
      instruction: `以下の形式で出力してください。

【似ていそうな案件候補】
・最大5件

【似ている理由】
・各案件ごとに1〜2行

【今回案件に活かせる点】
・5件

条件:
- 与えられた比較用案件だけを使う
- 本当に似ていそうなものだけ挙げる
- 似ていない場合は無理に挙げない`,
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
      { error: 'AI類似案件提案に失敗しました。' },
      { status: 500 }
    )
  }
}