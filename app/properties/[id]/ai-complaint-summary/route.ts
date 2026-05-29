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

    const { data: complaints } = await supabase
      .from('complaints')
      .select('title, detail, status, created_at')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(15)

    const prompt = `以下のクレーム情報をもとに、社内共有向けの「クレーム要約」と「再発防止コメント」を作成してください。

【条件】
・日本語
・見出し付き
・現場で使いやすい
・感情的ではなく事務的で丁寧
・最後に再発防止の一言を入れる

【物件情報】
物件名：${property.name ?? '未設定'}
住所：${property.address ?? '未設定'}

【クレーム一覧】
${
  (complaints ?? []).length === 0
    ? 'クレームなし'
    : (complaints ?? [])
        .map(
          (item) =>
            `・${formatDate(item.created_at)} / ${item.title ?? '件名未設定'} / 状況:${item.status ?? '未設定'} / 内容:${item.detail ?? '詳細なし'}`
        )
        .join('\n')
}`

    const text = await generateOpenAIText({
      systemPrompt:
        'あなたはマンション管理会社向けSaaSの実務補助AIです。クレーム対応の記録整理と再発防止コメントを、丁寧で使いやすい日本語で作ってください。',
      userPrompt: prompt,
    })

    return NextResponse.json({ text })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'AIクレーム要約の生成に失敗しました。',
      },
      { status: 500 }
    )
  }
}