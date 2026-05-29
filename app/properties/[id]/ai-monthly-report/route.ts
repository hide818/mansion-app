import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { generateOpenAIText } from '@/lib/openaiText'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

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

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id: propertyId } = await context.params
    const companyId = await getUserCompanyId()

    if (!companyId) {
      return NextResponse.json({ error: '会社情報を取得できません。' }, { status: 401 })
    }

    const supabase = await createSupabaseServerClient()

    const { data: property } = await supabase
      .from('properties')
      .select('id, name, address')
      .eq('id', propertyId)
      .eq('company_id', companyId)
      .single()

    if (!property) {
      return NextResponse.json({ error: '物件が見つかりません。' }, { status: 404 })
    }

    const { data: cases } = await supabase
      .from('cases')
      .select('title, status, assignee')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, status, due_date, priority')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(15)

    const { data: complaints } = await supabase
      .from('complaints')
      .select('title, status, created_at')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(10)

    const prompt = `以下の情報をもとに、マンション管理会社の社内共有や月次報告に使いやすい日本語文章を作成してください。

【条件】
・見出し付き
・丁寧な業務文
・現場でそのまま使いやすい
・長すぎない
・曖昧な表現を減らす
・最後に「今後の対応方針」も入れる

【物件情報】
物件名：${property.name ?? '未設定'}
住所：${property.address ?? '未設定'}

【案件】
${
  (cases ?? []).length === 0
    ? '案件なし'
    : (cases ?? [])
        .map(
          (item) =>
            `・${item.title ?? '案件名未設定'} / 状況:${item.status ?? '未設定'} / 担当:${item.assignee ?? '未設定'}`
        )
        .join('\n')
}

【タスク】
${
  (tasks ?? []).length === 0
    ? 'タスクなし'
    : (tasks ?? [])
        .map(
          (item) =>
            `・${item.title ?? 'タスク名未設定'} / 状況:${item.status ?? '未設定'} / 期限:${formatDate(item.due_date)} / 優先度:${item.priority ?? '未設定'}`
        )
        .join('\n')
}

【クレーム】
${
  (complaints ?? []).length === 0
    ? 'クレームなし'
    : (complaints ?? [])
        .map(
          (item) =>
            `・${formatDate(item.created_at)} / ${item.title ?? '件名未設定'} / 状況:${item.status ?? '未設定'}`
        )
        .join('\n')
}`

    const text = await generateOpenAIText({
      systemPrompt:
        'あなたはマンション管理会社向けSaaSの優秀な実務補助AIです。現場でそのまま使いやすい文章を、丁寧で自然な日本語で作成してください。',
      userPrompt: prompt,
    })

    return NextResponse.json({ text })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'AI月次報告の生成に失敗しました。',
      },
      { status: 500 }
    )
  }
}