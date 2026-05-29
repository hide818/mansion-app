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
      toolTitle: 'AI次アクション提案',
      instruction: `以下の形式で出力してください。

【今やること】
・3件

【今日中にやること】
・3件

【今週中にやること】
・3件

【放置リスク】
・3件

【上司に一言で共有する文】
1段落

条件:
- 抽象論は禁止
- ログとタスクの状況から、実務でそのまま使える内容にする
- 日本語で簡潔にする`,
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
      { error: 'AI次アクション提案に失敗しました。' },
      { status: 500 }
    )
  }
}