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
      .select('company_id, display_name, company_name')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'company_id が取得できません。' }, { status: 403 })
    }

    const companyId = profile.company_id
    const currentUserDisplayName = profile.display_name ?? ''
    const companyName = profile.company_name ?? ''

    const propertyId = request.nextUrl.searchParams.get('propertyId') ?? ''

    let bylawsArticle = ''
    let ownersTotalCount = ''
    let votingRightsTotalCount = ''

    if (propertyId) {
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
      }
    }

    const { data: staffRows } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('company_id', companyId)
      .order('display_name', { ascending: true })

    const staff = (staffRows ?? [])
      .map((row) => ({ displayName: row.display_name ?? '' }))
      .filter((row) => row.displayName)

    return NextResponse.json({
      bylawsArticle,
      ownersTotalCount,
      votingRightsTotalCount,
      companyName,
      currentUserDisplayName,
      staff,
    })
  } catch (error) {
    console.error('ai-minutes setup route error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 })
  }
}
