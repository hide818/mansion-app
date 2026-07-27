import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

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

    // ① companies テーブルに会社レコードを先に作成
    const { error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({ id: companyId, name: companyName })

    if (companyError) {
      console.error('company insert error:', companyError)
      return NextResponse.json({ error: '会社の作成に失敗しました: ' + companyError.message }, { status: 500 })
    }

    // ② Supabase Auth ユーザーを作成
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName || email, company_name: companyName },
    })

    if (authError || !authData.user) {
      // ロールバック: 作成した会社を削除
      await supabaseAdmin.from('companies').delete().eq('id', companyId)
      const msg = authError?.message ?? 'ユーザーの作成に失敗しました'
      if (msg.includes('already registered')) {
        return NextResponse.json({ error: 'このメールアドレスはすでに登録されています' }, { status: 400 })
      }
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    // ③ profiles テーブルにプロフィールを作成
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        company_id: companyId,
        role: 'admin',
        display_name: displayName || email,
      })

    if (profileError) {
      // ロールバック: 作成したユーザーと会社を削除
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      await supabaseAdmin.from('companies').delete().eq('id', companyId)
      console.error('profile insert error:', profileError)
      return NextResponse.json({ error: 'プロフィールの作成に失敗しました: ' + profileError.message }, { status: 500 })
    }

    // ④ サンプルデータを自動作成（新規登録直後の空画面を防ぐ）
    ;(async () => {
      try {
        const seedProperty1Id = crypto.randomUUID()
        const seedProperty2Id = crypto.randomUUID()
        const userId = authData.user.id

        await supabaseAdmin.from('properties').insert([
          {
            id: seedProperty1Id,
            company_id: companyId,
            name: 'サンプル｜グリーンヒルズ新宿',
            address: '東京都新宿区西新宿1-1-1',
            total_units: 32,
          },
          {
            id: seedProperty2Id,
            company_id: companyId,
            name: 'サンプル｜パークサイド渋谷',
            address: '東京都渋谷区渋谷2-2-2',
            total_units: 48,
          },
        ])

        const { data: cases } = await supabaseAdmin.from('cases').insert([
          {
            company_id: companyId,
            property_id: seedProperty1Id,
            title: '【サンプル】外壁・屋上防水の修繕工事',
            description: '長期修繕計画に基づく外壁塗装および屋上防水工事。業者選定・見積取得から理事会承認まで対応中。',
            status: '対応中',
            created_by: userId,
          },
          {
            company_id: companyId,
            property_id: seedProperty1Id,
            title: '【サンプル】エレベーター定期点検（法定）',
            description: '年1回の法定点検。点検業者：〇〇エレベーター株式会社。次回実施予定：2026年9月。',
            status: '未着手',
            created_by: userId,
          },
          {
            company_id: companyId,
            property_id: seedProperty2Id,
            title: '【サンプル】302号室 漏水クレーム対応',
            description: '302号室天井から漏水の申告あり。上階（402号室）の洗濯機排水ホースが原因と判明。修繕業者手配済み。',
            status: '対応中',
            created_by: userId,
          },
          {
            company_id: companyId,
            property_id: seedProperty2Id,
            title: '【サンプル】2026年度 通常総会の準備',
            description: '開催予定：2026年8月下旬。議案：修繕積立金改定、管理委託契約更新。招集通知は2週間前に発送。',
            status: '未着手',
            created_by: userId,
          },
        ]).select('id, property_id, title')

        if (cases && cases.length >= 4) {
          await supabaseAdmin.from('tasks').insert([
            {
              company_id: companyId,
              property_id: seedProperty1Id,
              case_id: cases[0].id,
              title: '【サンプル】3社見積もりの取得',
              description: 'A工務店・B建設・C塗装に見積依頼済み。返答期限：2026年8月15日。',
              status: '未着手',
              created_by: userId,
            },
            {
              company_id: companyId,
              property_id: seedProperty2Id,
              case_id: cases[2].id,
              title: '【サンプル】修繕業者への作業日程確認',
              description: '302・402号室両住民への日程通知も必要。',
              status: '対応中',
              created_by: userId,
            },
            {
              company_id: companyId,
              property_id: seedProperty2Id,
              case_id: cases[3].id,
              title: '【サンプル】総会議案書の作成',
              description: '修繕積立金改定案の資料を理事長に確認してもらう。期限：2026年8月10日。',
              status: '未着手',
              created_by: userId,
            },
          ])
        }
      } catch (err) {
        console.error('seed data error:', err)
      }
    })()

    // オーナーへのサインアップ通知メール
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      const resend = new Resend(resendKey)
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@kura-management.com'
      const toEmail = process.env.CONTACT_TO_EMAIL ?? 'komat_king@i.softbank.jp'
      await resend.emails.send({
        from: `Kura <${fromEmail}>`,
        to: toEmail,
        subject: `【Kura 新規登録】${companyName}`,
        html: `
          <h2 style="color:#1e3a5f;">新規ユーザーが登録しました</h2>
          <table border="1" cellpadding="8" style="border-collapse:collapse;margin-top:12px;">
            <tr><th style="background:#f1f5f9;text-align:left;">会社名</th><td>${companyName}</td></tr>
            <tr><th style="background:#f1f5f9;text-align:left;">担当者名</th><td>${displayName || '未入力'}</td></tr>
            <tr><th style="background:#f1f5f9;text-align:left;">メール</th><td>${email}</td></tr>
            <tr><th style="background:#f1f5f9;text-align:left;">登録日時</th><td>${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</td></tr>
          </table>
          <p style="margin-top:16px;color:#666;font-size:13px;">Kura 自動通知</p>
        `,
      }).catch(err => console.error('signup notification email error:', err))
    }

    return NextResponse.json({ ok: true, companyId })
  } catch (err) {
    console.error('signup route error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
