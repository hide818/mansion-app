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
      toolTitle: 'AI文書整形',
      instruction: `以下の形式で出力してください。

【社内共有向け】
1本

【上司向け丁寧版】
1本

【理事会向け説明版】
1本

【業者向け依頼版】
1本

条件:
- 全部そのままコピペできる日本語
- 冗長にしない
- 同じ内容を用途に応じて言い換える`,
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
      { error: 'AI文書整形に失敗しました。' },
      { status: 500 }
    )
  }
}