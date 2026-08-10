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

    const { data: profile } = await admin
      .from('profiles')
      .select('role, company_id, can_view_all_data')
      .eq('id', user.id)
      .single()

    const { data: company } = await admin
      .from('companies')
      .select('source')
      .eq('id', profile?.company_id)
      .single()

    const isOwnerAdmin = company?.source === null && (profile?.role === 'admin' || profile?.can_view_all_data)
    if (!isOwnerAdmin) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const yearMonth = getYearMonth()

    // 無料AI議事録ユーザー
    const { data: freeCompanies } = await admin
      .from('companies')
      .select('id, created_at')
      .eq('source', 'free_minutes')

    const companyIds = (freeCompanies ?? []).map(c => c.id)

    const { data: freeProfiles } = companyIds.length > 0
      ? await admin.from('profiles').select('id, company_id').in('company_id', companyIds)
      : { data: [] }

    const freeUserIds = (freeProfiles ?? []).map(p => p.id)

    // 当月使用状況
    const { data: currentUsages } = freeUserIds.length > 0
      ? await admin
          .from('free_minutes_usage')
          .select('user_id, used_count, survey_bonus_granted, kura_cta_clicked')
          .in('user_id', freeUserIds)
          .eq('year_month', yearMonth)
      : { data: [] }

    // 累計使用
    const { data: allUsages } = freeUserIds.length > 0
      ? await admin
          .from('free_minutes_usage')
          .select('user_id, used_count')
          .in('user_id', freeUserIds)
      : { data: [] }

    // アンケート（当月）
    const { data: surveys } = freeUserIds.length > 0
      ? await admin
          .from('free_minutes_surveys')
          .select('user_id, q3_kura_interest')
          .in('user_id', freeUserIds)
          .eq('year_month', yearMonth)
      : { data: [] }

    // トライアル開始（plan='trial'の会社、source=null）
    const { data: trialCompanies } = await admin
      .from('companies')
      .select('id, created_at')
      .eq('plan', 'trial')
      .is('source', null)

    // 有料ユーザー（plan not in trial/free_minutes/null）
    const { data: paidCompanies } = await admin
      .from('companies')
      .select('id')
      .not('plan', 'in', '("trial","free_minutes")')

    // ファネル計算
    const totalFreeRegistered = freeUserIds.length

    const totalUsageMap = new Map<string, number>()
    for (const u of allUsages ?? []) {
      totalUsageMap.set(u.user_id, (totalUsageMap.get(u.user_id) ?? 0) + u.used_count)
    }

    const everUsed = freeUserIds.filter(uid => (totalUsageMap.get(uid) ?? 0) > 0).length

    const currentUsageMap = new Map((currentUsages ?? []).map(u => [u.user_id, u]))

    const usedOnceThisMonth = freeUserIds.filter(uid => (currentUsageMap.get(uid)?.used_count ?? 0) >= 1).length
    const usedTwiceThisMonth = freeUserIds.filter(uid => (currentUsageMap.get(uid)?.used_count ?? 0) >= 2).length
    const surveyAnswered = (surveys ?? []).length
    const usedThreeThisMonth = freeUserIds.filter(uid => (currentUsageMap.get(uid)?.used_count ?? 0) >= 3).length
    const ctaClicked = freeUserIds.filter(uid => currentUsageMap.get(uid)?.kura_cta_clicked).length

    const kuraInterested = (surveys ?? []).filter(s =>
      s.q3_kura_interest === 'yes' || s.q3_kura_interest === 'try'
    ).length

    const trialStarted = (trialCompanies ?? []).length
    const paidStarted = (paidCompanies ?? []).length

    // 転換率
    function rate(numerator: number, denominator: number): number {
      if (denominator === 0) return 0
      return Math.round((numerator / denominator) * 100)
    }

    const funnel = [
      {
        label: '無料AI議事録 登録',
        value: totalFreeRegistered,
        note: 'source=free_minutesで登録した会社',
        rate: null,
      },
      {
        label: '初回利用（累計）',
        value: everUsed,
        note: '1回以上生成したユーザー',
        rate: rate(everUsed, totalFreeRegistered),
      },
      {
        label: '当月1回利用',
        value: usedOnceThisMonth,
        note: yearMonth,
        rate: rate(usedOnceThisMonth, totalFreeRegistered),
      },
      {
        label: '当月2回利用',
        value: usedTwiceThisMonth,
        note: yearMonth,
        rate: rate(usedTwiceThisMonth, usedOnceThisMonth),
      },
      {
        label: 'アンケート回答',
        value: surveyAnswered,
        note: '当月',
        rate: rate(surveyAnswered, usedTwiceThisMonth),
      },
      {
        label: '当月3回利用',
        value: usedThreeThisMonth,
        note: 'ボーナス利用',
        rate: rate(usedThreeThisMonth, surveyAnswered),
      },
      {
        label: 'Kuraに興味あり（アンケート）',
        value: kuraInterested,
        note: 'q3=yes/try',
        rate: rate(kuraInterested, surveyAnswered),
      },
      {
        label: 'KuraCTAクリック',
        value: ctaClicked,
        note: '無料トライアル導線クリック',
        rate: rate(ctaClicked, totalFreeRegistered),
      },
      {
        label: '無料トライアル開始（全体）',
        value: trialStarted,
        note: 'plan=trial、source=null',
        rate: null,
      },
      {
        label: '有料プラン（全体）',
        value: paidStarted,
        note: 'plan ≠ trial/free_minutes',
        rate: null,
      },
    ]

    const gaOnlyMetrics = [
      'LP訪問数（GA4: lp_view）',
      'デモ動画クリック（GA4: demo_video_click）',
      '無料診断開始（GA4: free_diagnosis_start）',
      '無料診断完了（GA4: free_diagnosis_complete）',
      '診断→AI議事録クリック（GA4: free_diagnosis_to_ai_minutes_click）',
      '診断→トライアルクリック（GA4: free_diagnosis_to_trial_click）',
    ]

    return NextResponse.json({
      yearMonth,
      funnel,
      gaOnlyMetrics,
      summary: {
        totalFreeRegistered,
        everUsed,
        currentMonthUsed: usedOnceThisMonth,
        surveyAnswered,
        ctaClicked,
        kuraInterested,
        trialStarted,
        paidStarted,
      },
    })
  } catch (e) {
    console.error('admin/funnel error:', e)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
