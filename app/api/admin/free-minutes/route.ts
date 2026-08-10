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

    // admin権限チェック
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

    // 無料議事録ユーザー一覧（source = 'free_minutes'の会社のprofile）
    const { data: freeCompanies } = await admin
      .from('companies')
      .select('id, name, created_at')
      .eq('source', 'free_minutes')
      .order('created_at', { ascending: false })

    const companyIds = (freeCompanies ?? []).map(c => c.id)

    const { data: profiles } = companyIds.length > 0
      ? await admin
          .from('profiles')
          .select('id, company_id')
          .in('company_id', companyIds)
      : { data: [] }

    const userIds = (profiles ?? []).map(p => p.id)

    // 当月利用状況
    const { data: usages } = userIds.length > 0
      ? await admin
          .from('free_minutes_usage')
          .select('user_id, year_month, used_count, survey_bonus_granted, survey_answered_at, kura_cta_clicked, first_used_at, last_used_at')
          .in('user_id', userIds)
      : { data: [] }

    const { data: currentMonthUsages } = userIds.length > 0
      ? await admin
          .from('free_minutes_usage')
          .select('user_id, used_count, survey_bonus_granted, survey_answered_at, kura_cta_clicked, first_used_at, last_used_at')
          .in('user_id', userIds)
          .eq('year_month', yearMonth)
      : { data: [] }

    // アンケート集計
    const { data: surveys } = userIds.length > 0
      ? await admin
          .from('free_minutes_surveys')
          .select('user_id, year_month, q1_usability, q2_current_time, q3_kura_interest, comment, created_at')
          .in('user_id', userIds)
          .order('created_at', { ascending: false })
      : { data: [] }

    // Auth users情報（メールアドレス取得）
    const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const authMap = new Map(
      (authUsers?.users ?? []).map(u => [u.id, { email: u.email, created_at: u.created_at }])
    )

    // ユーザー別データ構築
    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
    const companyMap = new Map((freeCompanies ?? []).map(c => [c.id, c]))
    const currentUsageMap = new Map((currentMonthUsages ?? []).map(u => [u.user_id, u]))

    // 累計利用回数
    const totalUsageMap = new Map<string, number>()
    for (const u of usages ?? []) {
      totalUsageMap.set(u.user_id, (totalUsageMap.get(u.user_id) ?? 0) + u.used_count)
    }

    const userRows = userIds.map(uid => {
      const p = profileMap.get(uid)
      const c = companyMap.get(p?.company_id ?? '')
      const auth = authMap.get(uid)
      const cu = currentUsageMap.get(uid)
      const surveyAnswered = (surveys ?? []).some(s => s.user_id === uid && s.year_month === yearMonth)

      return {
        userId: uid,
        email: auth?.email ?? '—',
        registeredAt: auth?.created_at ?? c?.created_at ?? null,
        companyName: c?.name ?? '—',
        currentMonthUsed: cu?.used_count ?? 0,
        currentMonthMax: 2 + (cu?.survey_bonus_granted ? 1 : 0),
        surveyBonusGranted: cu?.survey_bonus_granted ?? false,
        surveyAnsweredThisMonth: surveyAnswered,
        ctaClicked: cu?.kura_cta_clicked ?? false,
        totalUsed: totalUsageMap.get(uid) ?? 0,
        firstUsedAt: cu?.first_used_at ?? null,
        lastUsedAt: cu?.last_used_at ?? null,
      }
    })

    // KPI集計
    const totalRegistered = userIds.length
    const everUsed = userIds.filter(uid => (totalUsageMap.get(uid) ?? 0) > 0).length
    const currentMonthUsers = (currentMonthUsages ?? []).filter(u => u.used_count > 0).length
    const currentMonthGenerations = (currentMonthUsages ?? []).reduce((s, u) => s + u.used_count, 0)
    const totalGenerations = [...totalUsageMap.values()].reduce((s, v) => s + v, 0)
    const used1 = userIds.filter(uid => (currentUsageMap.get(uid)?.used_count ?? 0) >= 1).length
    const used2 = userIds.filter(uid => (currentUsageMap.get(uid)?.used_count ?? 0) >= 2).length
    const used3 = userIds.filter(uid => (currentUsageMap.get(uid)?.used_count ?? 0) >= 3).length
    const exhaustedNormal = userIds.filter(uid => {
      const cu = currentUsageMap.get(uid)
      return cu && cu.used_count >= 2 && !cu.survey_bonus_granted
    }).length
    const surveyCount = (surveys ?? []).filter(s => s.year_month === yearMonth).length
    const surveyRate = currentMonthUsers > 0 ? Math.round((surveyCount / currentMonthUsers) * 100) : 0
    const bonusGranted = (currentMonthUsages ?? []).filter(u => u.survey_bonus_granted).length
    const exhaustedAll = userIds.filter(uid => {
      const cu = currentUsageMap.get(uid)
      return cu && cu.used_count >= 3 && cu.survey_bonus_granted
    }).length
    const ctaClicks = userIds.filter(uid => currentUsageMap.get(uid)?.kura_cta_clicked).length
    const neverUsed = totalRegistered - everUsed

    // アンケート集計（%）
    const currentSurveys = (surveys ?? []).filter(s => s.year_month === yearMonth)
    const q1Counts: Record<string, number> = {}
    const q2Counts: Record<string, number> = {}
    const q3Counts: Record<string, number> = {}
    for (const s of currentSurveys) {
      q1Counts[s.q1_usability] = (q1Counts[s.q1_usability] ?? 0) + 1
      q2Counts[s.q2_current_time] = (q2Counts[s.q2_current_time] ?? 0) + 1
      q3Counts[s.q3_kura_interest] = (q3Counts[s.q3_kura_interest] ?? 0) + 1
    }

    return NextResponse.json({
      yearMonth,
      kpi: {
        totalRegistered,
        neverUsed,
        everUsed,
        currentMonthUsers,
        currentMonthGenerations,
        totalGenerations,
        used1,
        used2,
        used3,
        exhaustedNormal,
        surveyCount,
        surveyRate,
        bonusGranted,
        exhaustedAll,
        ctaClicks,
      },
      surveyAggregation: { q1: q1Counts, q2: q2Counts, q3: q3Counts, total: currentSurveys.length },
      users: userRows,
      surveys: surveys ?? [],
    })
  } catch (e) {
    console.error('admin/free-minutes error:', e)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
