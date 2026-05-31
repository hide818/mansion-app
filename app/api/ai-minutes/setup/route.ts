import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, display_name')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.company_id) {
      console.error('[setup] company_id not found for user:', user.id)
      return NextResponse.json({ error: 'company_id が取得できません。' }, { status: 403 })
    }

    const companyId = profile.company_id
    const currentUserDisplayName = profile.display_name ?? ''

    // companies テーブルから会社名を取得
    const { data: companyRow } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .maybeSingle()

    const companyName = companyRow?.name ?? ''

    const propertyId = request.nextUrl.searchParams.get('propertyId') ?? ''

    let bylawsArticle = ''
    let ownersTotalCount = ''
    let votingRightsTotalCount = ''

    if (propertyId) {
      // 1st try: company_id 条件あり（通常パス）
      const { data: propertyRow } = await supabase
        .from('properties')
        .select('bylaws_article, owners_total_count, voting_rights_total_count')
        .eq('id', propertyId)
        .eq('company_id', companyId)
        .maybeSingle()

      if (propertyRow) {
        bylawsArticle = propertyRow.bylaws_article ?? ''
        ownersTotalCount = propertyRow.owners_total_count ?? ''
        votingRightsTotalCount = propertyRow.voting_rights_total_count ?? ''
        console.log(`[setup] property ${propertyId} loaded via company_id:`, {
          bylawsArticle,
          ownersTotalCount,
          votingRightsTotalCount,
        })
      } else {
        // 2nd try: propertyId のみで再取得（開発時 fallback）
        console.warn(`[setup] property ${propertyId} not found with company_id, trying fallback...`)
        const { data: fallbackRow } = await supabase
          .from('properties')
          .select('bylaws_article, owners_total_count, voting_rights_total_count')
          .eq('id', propertyId)
          .maybeSingle()

        if (fallbackRow) {
          bylawsArticle = fallbackRow.bylaws_article ?? ''
          ownersTotalCount = fallbackRow.owners_total_count ?? ''
          votingRightsTotalCount = fallbackRow.voting_rights_total_count ?? ''
          console.log(`[setup] property ${propertyId} loaded via fallback:`, {
            bylawsArticle,
            ownersTotalCount,
            votingRightsTotalCount,
          })
        } else {
          console.warn(`[setup] property ${propertyId} not found even via fallback`)
        }
      }
    }

    // minutes_staff_members から担当者候補を取得
    // テーブル未作成時は profiles.display_name で代替
    const { data: staffRows, error: staffError } = await supabase
      .from('minutes_staff_members')
      .select('name')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })

    let staffMembers: Array<{ displayName: string }> = []

    if (staffError) {
      console.warn('[setup] minutes_staff_members unavailable, falling back to profiles:', staffError.message)
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('company_id', companyId)
        .order('display_name', { ascending: true })

      staffMembers = (profileRows ?? [])
        .map((row) => ({ displayName: row.display_name ?? '' }))
        .filter((row) => row.displayName)
    } else {
      staffMembers = (staffRows ?? [])
        .map((row) => ({ displayName: row.name }))
        .filter((row) => row.displayName)
    }

    console.log(`[setup] returning companyName="${companyName}", staffMembers:`, staffMembers.length)

    return NextResponse.json({
      bylawsArticle,
      ownersTotalCount,
      votingRightsTotalCount,
      companyName,
      currentUserDisplayName,
      staffMembers,
    })
  } catch (error) {
    console.error('[setup] unexpected error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 })
  }
}
