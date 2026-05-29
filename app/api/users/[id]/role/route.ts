import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, context: RouteContext) {
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
      return new NextResponse('管理者のみ変更できます。', { status: 403 })
    }

    const body = await request.json()
    const nextRole = body?.role

    if (nextRole !== 'admin' && nextRole !== 'general' && nextRole !== 'viewer') {
      return new NextResponse('role が不正です。', { status: 400 })
    }

    const { id: targetUserId } = await context.params

    const { data: targetProfile, error: targetProfileError } = await supabase
      .from('profiles')
      .select('id, company_id, role')
      .eq('id', targetUserId)
      .maybeSingle()

    if (targetProfileError || !targetProfile) {
      return new NextResponse('対象ユーザーが見つかりません。', { status: 404 })
    }

    if (targetProfile.company_id !== actorProfile.company_id) {
      return new NextResponse('他社ユーザーは変更できません。', { status: 403 })
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: nextRole })
      .eq('id', targetUserId)

    if (updateError) {
      console.error('role update error:', updateError)
      return new NextResponse('権限変更に失敗しました。', { status: 500 })
    }

    const detail = `role: ${targetProfile.role ?? 'null'} -> ${nextRole}`

    const { error: auditError } = await supabase.from('audit_logs').insert({
      company_id: actorProfile.company_id,
      user_id: user.id,
      action: 'user_role_updated',
      target_type: 'profile',
      target_id: targetUserId,
      detail,
    })

    if (auditError) {
      console.error('audit insert error:', auditError)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('user role route error:', error)
    return new NextResponse('権限変更中にエラーが発生しました。', { status: 500 })
  }
}