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
      toolTitle: 'AI理事会シミュレーション',
      instruction: `以下の形式で出力してください。

【理事会で聞かれそうな質問】
1.
2.
3.
4.
5.

【それぞれの回答例】
1.
2.
3.
4.
5.

【詰まりそうな点】
・3件

条件:
- マンション管理会社の理事会で本当に聞かれそうな内容にする
- 回答は逃げずに、実務的に答える
- 不足情報がある場合は、どこが不足かも書く`,
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
      { error: 'AI理事会シミュレーションに失敗しました。' },
      { status: 500 }
    )
  }
}