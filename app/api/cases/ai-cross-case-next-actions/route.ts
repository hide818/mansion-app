import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { generateOpenAIText } from '@/lib/openaiText'

function formatDate(value: string | null) {
  if (!value) return '未設定'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export async function POST() {
  try {
    const companyId = await getUserCompanyId()

    if (!companyId) {
      return NextResponse.json({ error: '会社情報を取得できません。' }, { status: 401 })
    }

    const supabase = await createSupabaseServerClient()

    const { data: cases } = await supabase
      .from('cases')
      .select('id, title, status, assignee, board_status, board_scheduled_for')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(20)

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, due_date, priority, case_id')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(30)

    const prompt = `以下の案件一覧とタスク一覧を見て、案件横断での次アクション提案を作成してください。

【条件】
・日本語
・見出し付き
・最初に「最優先で触る案件」
・次に「今週中に整理すべき案件」
・次に「保留でよい案件」
・最後に「担当者視点の注意点」
・優先順位が伝わるようにする

【案件一覧】
${
  (cases ?? []).length === 0
    ? '案件なし'
    : (cases ?? [])
        .map(
          (item) =>
            `・案件名:${item.title ?? '案件名未設定'} / 状況:${item.status ?? '未設定'} / 担当:${item.assignee ?? '未設定'} / 理事会:${item.board_status ?? '未設定'} / 上程予定:${formatDate(item.board_scheduled_for)}`
        )
        .join('\n')
}

【タスク一覧】
${
  (tasks ?? []).length === 0
    ? 'タスクなし'
    : (tasks ?? [])
        .map(
          (item) =>
            `・${item.title ?? 'タスク名未設定'} / 状況:${item.status ?? '未設定'} / 期限:${formatDate(item.due_date)} / 優先度:${item.priority ?? '未設定'}`
        )
        .join('\n')
}`

    const text = await generateOpenAIText({
      systemPrompt:
        'あなたはマンション管理会社向けSaaSの実務補助AIです。複数案件を横断して、今触るべき案件の優先順位を実務的に提案してください。',
      userPrompt: prompt,
    })

    return NextResponse.json({ text })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'AI次アクション提案（案件横断版）の生成に失敗しました。',
      },
      { status: 500 }
    )
  }
}