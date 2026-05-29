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
      toolTitle: 'AI理事会説明文生成',
      instruction: `以下の形式で出力してください。

【理事会での説明文】
2〜4段落

【短く説明する版】
1段落

【聞かれやすい確認ポイント】
・5件

条件:
- 管理会社の担当者が理事会で口頭説明できる内容にする
- 難しい言い回しは避ける
- 何を決めたい案件なのかが分かるようにする`,
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
      { error: 'AI理事会説明文生成に失敗しました。' },
      { status: 500 }
    )
  }
}