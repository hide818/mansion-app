import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getPlanUserLimit, getPlanLabel } from '@/lib/planLimits'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return new NextResponse('ログイン情報を確認できませんでした。', { status: 401 })
    }

    const { data: actorProfile, error: actorProfileError } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .maybeSingle()

    if (actorProfileError || !actorProfile?.company_id) {
      return new NextResponse('所属会社を確認できませんでした。', { status: 400 })
    }

    if (actorProfile.role !== 'admin') {
      return new NextResponse('管理者のみ招待リンクを発行できます。', { status: 403 })
    }

    const companyId = actorProfile.company_id

    // ── プラン上限チェック ──────────────────────────────────────
    const [{ data: companyRow }, { count: currentUserCount }] = await Promise.all([
      supabase.from('companies').select('plan').eq('id', companyId).maybeSingle(),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    ])

    const plan = companyRow?.plan ?? 'trial'
    const limit = getPlanUserLimit(plan)
    const used = currentUserCount ?? 0

    if (used >= limit) {
      return new NextResponse(
        `ユーザー数の上限（${limit}名）に達しています。現在のプラン：${getPlanLabel(plan)}。プランをアップグレードしてください。`,
        { status: 403 },
      )
    }

    const body = await request.json()
    const email =
      typeof body?.email === 'string' && body.email.trim() ? body.email.trim() : null
    const role = body?.role

    if (role !== 'admin' && role !== 'general' && role !== 'viewer') {
      return new NextResponse('role が不正です。', { status: 400 })
    }

    const token = crypto.randomUUID()

    const { data: invitation, error: invitationError } = await supabase
      .from('company_invitations')
      .insert({
        company_id: actorProfile.company_id,
        email,
        role,
        token,
        invited_by: user.id,
        status: 'pending',
      })
      .select('id, token, role, email, created_at, expires_at')
      .maybeSingle()

    if (invitationError || !invitation) {
      console.error('invitation insert error:', invitationError)
      return new NextResponse('招待リンクの発行に失敗しました。', { status: 500 })
    }

    const detail = `role=${role}${email ? `, email=${email}` : ''}`

    const { error: auditError } = await supabase.from('audit_logs').insert({
      company_id: actorProfile.company_id,
      user_id: user.id,
      action: 'invitation_created',
      target_type: 'company_invitation',
      target_id: invitation.id,
      detail,
    })

    if (auditError) {
      console.error('audit insert error:', auditError)
    }

    return NextResponse.json({
      ok: true,
      invitation,
    })
  } catch (error) {
    console.error('invitation route error:', error)
    return new NextResponse('招待リンク発行中にエラーが発生しました。', { status: 500 })
  }
}