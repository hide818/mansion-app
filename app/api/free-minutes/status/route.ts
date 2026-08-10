import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function getYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '未ログイン' }, { status: 401 })

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // 会社のsourceを確認
    const { data: profile } = await admin
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    const { data: company } = await admin
      .from('companies')
      .select('source')
      .eq('id', profile?.company_id)
      .single()

    const isFreeMinutesUser = company?.source === 'free_minutes'

    const yearMonth = getYearMonth()

    const { data: usage } = await admin
      .from('free_minutes_usage')
      .select('used_count, survey_bonus_granted, survey_answered_at, kura_cta_clicked, first_used_at')
      .eq('user_id', user.id)
      .eq('year_month', yearMonth)
      .maybeSingle()

    const { data: surveyRow } = await admin
      .from('free_minutes_surveys')
      .select('id')
      .eq('user_id', user.id)
      .eq('year_month', yearMonth)
      .maybeSingle()

    const usedCount = usage?.used_count ?? 0
    const surveyBonus = usage?.survey_bonus_granted ?? false
    const maxUses = 2 + (surveyBonus ? 1 : 0)
    const remaining = Math.max(0, maxUses - usedCount)
    const hasUsedOnce = (usage?.first_used_at) != null
    const surveyAnsweredThisMonth = surveyRow != null

    return NextResponse.json({
      isFreeMinutesUser,
      yearMonth,
      usedCount,
      maxUses,
      remaining,
      surveyBonus,
      hasUsedOnce,
      surveyAnsweredThisMonth,
      ctaClicked: usage?.kura_cta_clicked ?? false,
    })
  } catch (e) {
    console.error('free-minutes/status error:', e)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
