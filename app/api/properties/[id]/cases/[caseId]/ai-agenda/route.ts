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
      toolTitle: 'AI議案生成',
      instruction: `以下の形式で出力してください。

【議案タイトル案】
・3案

【議案本文】
2〜4段落

【決議したい内容】
・3件

【理事会で確認すべきこと】
・5件

条件:
- 管理組合向けの議案として自然な表現にする
- 何を承認・確認したいのか明確にする
- ぼんやりした文章にしない`,
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
      { error: 'AI議案生成に失敗しました。' },
      { status: 500 }
    )
  }
}