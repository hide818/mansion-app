import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, email, company } = await request.json()
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })

  const resend = new Resend(apiKey)
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@kura-management.com'
  const signupUrl = 'https://kura-management.com/signup'

  await resend.emails.send({
    from: `Kura <${fromEmail}>`,
    to: email,
    subject: '【Kura】アカウントの準備が整いました',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1e293b;">
        <div style="background:#070E1C;padding:24px 32px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;font-size:20px;margin:0;">Kura</h1>
          <p style="color:#94a3b8;font-size:12px;margin:4px 0 0;">管理会社専用AI</p>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
          <p style="font-size:16px;font-weight:bold;">${name} 様</p>
          <p style="line-height:1.8;color:#475569;">
            このたびはKuraにお申し込みいただき、誠にありがとうございます。<br>
            ${company ? `<strong>${company}</strong>様の` : ''}アカウントの設定が完了いたしました。
          </p>
          <div style="margin:28px 0;text-align:center;">
            <a href="${signupUrl}"
              style="display:inline-block;background:#2563eb;color:#fff;font-weight:bold;font-size:15px;padding:14px 36px;border-radius:12px;text-decoration:none;">
              Kuraをはじめる
            </a>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:24px;">
            <p style="font-size:12px;font-weight:bold;color:#64748b;margin:0 0 8px;">ご利用について</p>
            <ul style="font-size:13px;color:#475569;margin:0;padding-left:16px;line-height:2;">
              <li>3ヶ月間は完全無料でご利用いただけます</li>
              <li>クレジットカードの登録は不要です</li>
              <li>物件数・案件数は無制限です</li>
              <li>ご不明な点はこのメールへ返信ください</li>
            </ul>
          </div>
          <p style="line-height:1.8;color:#475569;">
            まずは物件を登録して、AI議事録機能をお試しください。<br>
            設定でお困りの際は使い方ガイドをご覧ください。
          </p>
          <div style="text-align:center;margin:16px 0;">
            <a href="https://kura-management.com/help"
              style="display:inline-block;background:#f1f5f9;color:#2563eb;font-weight:bold;font-size:13px;padding:10px 24px;border-radius:8px;text-decoration:none;border:1px solid #e2e8f0;">
              使い方ガイドを見る
            </a>
          </div>
          <p style="margin-top:32px;color:#475569;">
            よろしくお願いいたします。<br>
            <strong>Kura サポートチーム</strong>
          </p>
        </div>
        <p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:16px;">
          © 2024 Kura. All rights reserved.
        </p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
