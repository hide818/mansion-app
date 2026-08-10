import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function getYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '未ログイン' }, { status: 401 })

    const body = await req.json()
    const { q1_usability, q2_current_time, q3_kura_interest, comment } = body

    if (!q1_usability || !q2_current_time || !q3_kura_interest) {
      return NextResponse.json({ error: '必須項目が未入力です' }, { status: 400 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const yearMonth = getYearMonth()

    // 当月に1回以上生成済みか確認
    const { data: usage } = await admin
      .from('free_minutes_usage')
      .select('used_count, survey_bonus_granted')
      .eq('user_id', user.id)
      .eq('year_month', yearMonth)
      .maybeSingle()

    if (!usage || usage.used_count < 1) {
      return NextResponse.json({ error: 'AI議事録を1回以上利用してからアンケートに回答してください' }, { status: 403 })
    }

    if (usage.survey_bonus_granted) {
      return NextResponse.json({ error: '当月のアンケート特典はすでに付与済みです' }, { status: 409 })
    }

    // 既存回答チェック（UNIQUE制約でもはじかれるがメッセージのため先に確認）
    const { data: existing } = await admin
      .from('free_minutes_surveys')
      .select('id')
      .eq('user_id', user.id)
      .eq('year_month', yearMonth)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: '当月のアンケートは回答済みです' }, { status: 409 })
    }

    // アンケート保存 + ボーナス付与（両方成功した場合のみOK）
    const { error: surveyError } = await admin
      .from('free_minutes_surveys')
      .insert({
        user_id: user.id,
        year_month: yearMonth,
        q1_usability,
        q2_current_time,
        q3_kura_interest,
        comment: comment || null,
      })

    if (surveyError) {
      console.error('survey insert error:', surveyError)
      return NextResponse.json({ error: 'アンケートの保存に失敗しました' }, { status: 500 })
    }

    // ボーナス付与
    const { error: bonusError } = await admin
      .from('free_minutes_usage')
      .update({ survey_bonus_granted: true, survey_answered_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('year_month', yearMonth)

    if (bonusError) {
      // アンケートを保存したのにボーナス付与失敗 → ロールバック
      await admin.from('free_minutes_surveys').delete().eq('user_id', user.id).eq('year_month', yearMonth)
      console.error('bonus grant error:', bonusError)
      return NextResponse.json({ error: 'ボーナス付与に失敗しました。もう一度お試しください' }, { status: 500 })
    }

    const newMax = 2 + 1  // 通常2 + ボーナス1
    const remaining = Math.max(0, newMax - usage.used_count)

    return NextResponse.json({ ok: true, remaining, maxUses: newMax })
  } catch (e) {
    console.error('free-minutes/survey error:', e)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
