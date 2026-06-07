import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { company, name, email, propertyCount, message } = body

    if (!name || !email) {
      return NextResponse.json({ error: '名前とメールアドレスは必須です' }, { status: 400 })
    }

    // Supabaseにリード保存
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    await supabase.from('leads').insert({
      company: company ?? null,
      name,
      email,
      property_count: propertyCount ?? null,
      message: message ?? null,
      status: 'new',
    })

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.log('Contact form submission:', { company, name, email, propertyCount, message })
      return NextResponse.json({ ok: true })
    }

    const resend = new Resend(apiKey)
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@kura-management.com'
    const toEmail = process.env.CONTACT_TO_EMAIL ?? 'komat_king@i.softbank.jp'

    // オーナーへの通知メール・自動返信メールを並列送信
    await Promise.all([
      // オーナーへの通知
      resend.emails.send({
        from: `Kura お問い合わせ <${fromEmail}>`,
        to: toEmail,
        subject: `【Kura デモ申込】${company ?? ''} ${name}様`,
        html: `
          <h2 style="color:#1e3a5f;">Kura デモ申し込みがありました</h2>
          <table border="1" cellpadding="8" style="border-collapse:collapse;margin-top:12px;">
            <tr><th style="background:#f1f5f9;text-align:left;">会社名</th><td>${company ?? '未入力'}</td></tr>
            <tr><th style="background:#f1f5f9;text-align:left;">お名前</th><td>${name}</td></tr>
            <tr><th style="background:#f1f5f9;text-align:left;">メール</th><td>${email}</td></tr>
            <tr><th style="background:#f1f5f9;text-align:left;">物件数</th><td>${propertyCount ?? '未選択'}</td></tr>
            <tr><th style="background:#f1f5f9;text-align:left;">ご質問</th><td>${message ?? 'なし'}</td></tr>
          </table>
          <p style="margin-top:16px;color:#666;font-size:13px;">このメールはKura お問い合わせフォームから自動送信されました。</p>
        `,
        replyTo: email,
      }),

      // 申し込み者への自動返信
      resend.emails.send({
        from: `Kura <${fromEmail}>`,
        to: email,
        subject: 'Kura デモのお申し込みありがとうございます',
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1e293b;">
            <div style="background:#070E1C;padding:24px 32px;border-radius:12px 12px 0 0;">
              <h1 style="color:#fff;font-size:20px;margin:0;">Kura</h1>
              <p style="color:#94a3b8;font-size:12px;margin:4px 0 0;">管理会社専用AI</p>
            </div>
            <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
              <p style="font-size:16px;font-weight:bold;">${name} 様</p>
              <p style="line-height:1.8;color:#475569;">
                このたびはKuraのデモをお申し込みいただき、誠にありがとうございます。<br>
                担当者より<strong>3営業日以内</strong>にご連絡いたします。
              </p>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:24px 0;">
                <p style="font-size:12px;font-weight:bold;color:#64748b;margin:0 0 8px;">お申し込み内容</p>
                <table style="font-size:13px;width:100%;">
                  <tr><td style="color:#94a3b8;padding:3px 0;width:80px;">会社名</td><td>${company ?? '未入力'}</td></tr>
                  <tr><td style="color:#94a3b8;padding:3px 0;">お名前</td><td>${name}</td></tr>
                  <tr><td style="color:#94a3b8;padding:3px 0;">物件数</td><td>${propertyCount ?? '未選択'}</td></tr>
                </table>
              </div>
              <p style="line-height:1.8;color:#475569;">
                ご不明な点がございましたら、このメールへ返信いただくか、お気軽にお問い合わせください。
              </p>
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
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('contact route error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
