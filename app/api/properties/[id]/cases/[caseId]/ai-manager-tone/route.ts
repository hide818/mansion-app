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
      toolTitle: 'AI上司向け文体整形',
      instruction: `以下の形式で出力してください。

【上司向け報告文】
1本

【短く言う版】
1本

【確認依頼を入れた版】
1本

条件:
- 丁寧で自然な社内向け日本語
- 長すぎない
- 現在の状況、問題点、次アクションが分かるようにする
- 「表題の件」などのかたすぎる社外文体にはしない`,
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
      { error: 'AI上司向け文体整形に失敗しました。' },
      { status: 500 }
    )
  }
}