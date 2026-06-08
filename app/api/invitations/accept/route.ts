import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// GET: トークンの有効性チェック（招待ページの初期表示用）
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'トークンがありません' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: invite, error } = await supabase
    .from('company_invitations')
    .select('id, email, role, status, expires_at, company_id, companies(name)')
    .eq('token', token)
    .maybeSingle()

  if (error || !invite) return NextResponse.json({ error: '招待リンクが無効です' }, { status: 404 })
  if (invite.status !== 'pending') return NextResponse.json({ error: 'この招待リンクはすでに使用済みです' }, { status: 410 })
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: '招待リンクの有効期限が切れています' }, { status: 410 })
  }

  const companyName = (invite.companies as { name?: string } | null)?.name ?? ''

  return NextResponse.json({
    ok: true,
    email: invite.email,
    role: invite.role,
    companyName,
  })
}

// POST: 招待承諾 → アカウント作成 → 会社に紐付け
export async function POST(request: NextRequest) {
  const { token, password, displayName } = await request.json() as {
    token: string
    password: string
    displayName: string
  }

  if (!token || !password || !displayName) {
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'パスワードは8文字以上にしてください' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // トークン検証
  const { data: invite, error: inviteError } = await supabase
    .from('company_invitations')
    .select('id, email, role, status, expires_at, company_id')
    .eq('token', token)
    .maybeSingle()

  if (inviteError || !invite) return NextResponse.json({ error: '招待リンクが無効です' }, { status: 404 })
  if (invite.status !== 'pending') return NextResponse.json({ error: 'この招待リンクはすでに使用済みです' }, { status: 410 })
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: '招待リンクの有効期限が切れています' }, { status: 410 })
  }

  if (!invite.email) {
    return NextResponse.json({ error: 'この招待リンクはメールアドレスが指定されていません。管理者に再発行を依頼してください。' }, { status: 400 })
  }

  // ユーザー作成
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  })

  if (authError || !authData.user) {
    const msg = authError?.message ?? 'ユーザーの作成に失敗しました'
    if (msg.includes('already registered')) {
      return NextResponse.json({ error: 'このメールアドレスはすでに登録されています' }, { status: 400 })
    }
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // プロフィール作成（会社に紐付け）
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      company_id: invite.company_id,
      role: invite.role,
      display_name: displayName,
    })

  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: 'プロフィールの作成に失敗しました: ' + profileError.message }, { status: 500 })
  }

  // 招待ステータスを accepted に更新
  await supabase
    .from('company_invitations')
    .update({ status: 'accepted' })
    .eq('id', invite.id)

  return NextResponse.json({ ok: true })
}
