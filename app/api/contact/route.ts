import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { company, name, email, propertyCount, message } = body

    if (!name || !email) {
      return NextResponse.json({ error: '名前とメールアドレスは必須です' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      // Resend未設定の場合はログだけ出してOKを返す（開発環境用）
      console.log('Contact form submission:', { company, name, email, propertyCount, message })
      return NextResponse.json({ ok: true })
    }

    const resend = new Resend(apiKey)
    const toEmail = process.env.CONTACT_TO_EMAIL ?? 'komat_king@i.softbank.jp'

    await resend.emails.send({
      from: 'Kura お問い合わせ <noreply@kura.app>',
      to: toEmail,
      subject: `【Kura デモ申込】${company ?? ''} ${name}様`,
      html: `
        <h2>Kura デモ申し込みがありました</h2>
        <table border="1" cellpadding="8" style="border-collapse:collapse;">
          <tr><th>会社名</th><td>${company ?? '未入力'}</td></tr>
          <tr><th>お名前</th><td>${name}</td></tr>
          <tr><th>メール</th><td>${email}</td></tr>
          <tr><th>物件数</th><td>${propertyCount ?? '未選択'}</td></tr>
          <tr><th>ご質問</th><td>${message ?? 'なし'}</td></tr>
        </table>
        <p style="margin-top:16px;color:#666;">このメールはKura お問い合わせフォームから自動送信されました。</p>
      `,
      replyTo: email,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('contact route error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
