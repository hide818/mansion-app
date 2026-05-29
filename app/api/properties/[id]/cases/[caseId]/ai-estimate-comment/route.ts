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
      toolTitle: 'AI見積比較コメント生成',
      instruction: `以下の形式で出力してください。

【見積確認コメント】
2〜4段落

【比較時に見るべき点】
・5件

【不足している確認項目】
・5件

条件:
- 添付資料のファイル名と備考から判断する
- 金額や保証が不明なら、不明と明記する
- 分からないことを勝手に断定しない`,
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
      { error: 'AI見積比較コメント生成に失敗しました。' },
      { status: 500 }
    )
  }
}