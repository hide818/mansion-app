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
      toolTitle: 'AIテンプレ提案',
      instruction: `以下の形式で出力してください。

【社内進捗共有テンプレ】
1本

【理事会報告テンプレ】
1本

【業者依頼テンプレ】
1本

【この案件で今後よく使いそうな定型文】
・5件

条件:
- そのままコピペできる自然な日本語にする
- 長すぎない
- 案件の状況を反映する`,
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
      { error: 'AIテンプレ提案に失敗しました。' },
      { status: 500 }
    )
  }
}