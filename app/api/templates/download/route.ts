import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, company, templateId = 'sokai-gijiroku' } = body

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'メールアドレスが正しくありません' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    await supabase.from('leads').insert({
      company: company ?? null,
      name: null,
      email,
      message: `テンプレートDL: ${templateId}`,
      status: 'new',
    })

    const TEMPLATES: Record<string, { name: string; url: string }> = {
      'sokai-gijiroku': {
        name: '総会議事録テンプレート',
        url: 'https://kura-management.com/templates/sokai-gijiroku-template.html',
      },
    }

    const template = TEMPLATES[templateId] ?? TEMPLATES['sokai-gijiroku']

    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      const resend = new Resend(apiKey)
      await resend.emails.send({
        from: 'Kura <info@kura-management.com>',
        to: email,
        subject: `【Kura】${template.name}をお送りします`,
        html: `
<div style="font-family:'Hiragino Kaku Gothic ProN','Meiryo',sans-serif;max-width:560px;margin:0 auto;color:#1d1d1f;font-size:14px;line-height:1.8">
  <div style="background:#0071e3;padding:24px 32px">
    <span style="color:#fff;font-size:18px;font-weight:bold">Kura</span>
  </div>
  <div style="padding:32px">
    <p>この度は${template.name}をご請求いただきありがとうございます。</p>
    <p style="margin-top:16px">以下のリンクからテンプレートをご覧いただけます。ブラウザで開き、印刷またはPDF保存してご利用ください。</p>
    <div style="margin:24px 0;text-align:center">
      <a href="${template.url}" style="background:#0071e3;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;font-size:14px">
        テンプレートを開く →
      </a>
    </div>
    <hr style="border:none;border-top:1px solid #e5e5ea;margin:24px 0">
    <p style="font-size:13px;color:#6e6e73">
      Kuraは分譲マンション管理会社向けのAI業務管理SaaSです。<br>
      総会議事録の作成・案件タスク管理・担当者引き継ぎ書の自動生成を1つにまとめています。<br><br>
      <a href="https://kura-management.com/lp?utm_source=email&utm_medium=template&utm_campaign=template_dl" style="color:#0071e3">14日間無料で試す →</a>
    </p>
  </div>
  <div style="background:#f5f5f7;padding:16px 32px;font-size:11px;color:#98989d;text-align:center">
    Kura — kura-management.com ／ このメールはご請求に応じてお送りしています
  </div>
</div>`,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('template download error:', e)
    return NextResponse.json({ error: 'エラーが発生しました' }, { status: 500 })
  }
}
