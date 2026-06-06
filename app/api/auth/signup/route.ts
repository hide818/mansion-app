import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// サインアップAPIはService Role Keyが必要（profilesへのINSERT）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, displayName, companyName } = body

    if (!email || !password || !companyName) {
      return NextResponse.json({ error: 'メールアドレス・パスワード・会社名は必須です' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'パスワードは8文字以上にしてください' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // 新しいcompany_idを生成
    const companyId = crypto.randomUUID()

    // ユーザー作成
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName || email, company_name: companyName },
    })

    if (authError || !authData.user) {
      const msg = authError?.message ?? 'ユーザーの作成に失敗しました'
      if (msg.includes('already registered')) {
        return NextResponse.json({ error: 'このメールアドレスはすでに登録されています' }, { status: 400 })
      }
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    // プロフィール作成（admin権限）
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        company_id: companyId,
        role: 'admin',
        display_name: displayName || email,
        email,
      })

    if (profileError) {
      // ロールバック: 作成したユーザーを削除
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      console.error('profile insert error:', profileError)
      return NextResponse.json({ error: 'プロフィールの作成に失敗しました: ' + profileError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, companyId })
  } catch (err) {
    console.error('signup route error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
