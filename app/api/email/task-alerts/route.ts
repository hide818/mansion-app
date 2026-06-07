import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const CRON_SECRET = process.env.CRON_SECRET ?? ''

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const today = new Date().toISOString().slice(0, 10)

  // 期限切れ・今日期限のタスクを取得
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, due_date, assigned_to, status, property_id')
    .neq('status', 'done')
    .lte('due_date', today)
    .not('assigned_to', 'is', null)

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // ユーザーごとにグループ化
  const byUser = new Map<string, typeof tasks>()
  for (const task of tasks) {
    const uid = task.assigned_to as string
    if (!byUser.has(uid)) byUser.set(uid, [])
    byUser.get(uid)!.push(task)
  }

  const resend = new Resend(apiKey)
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@kura-management.com'
  let totalSent = 0

  for (const [userId, userTasks] of byUser) {
    // ユーザーのメールアドレスを取得
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, display_name')
      .eq('id', userId)
      .single()

    if (!profile?.email) continue

    const overdue = userTasks.filter(t => t.due_date < today)
    const dueToday = userTasks.filter(t => t.due_date === today)

    const overdueRows = overdue.map(t => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #fee2e2;color:#dc2626;font-weight:600;">期限切れ</td>
        <td style="padding:8px 12px;border-bottom:1px solid #fee2e2;">${t.title ?? '（タイトルなし）'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #fee2e2;color:#94a3b8;">${t.due_date}</td>
      </tr>`).join('')

    const todayRows = dueToday.map(t => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #fef3c7;color:#d97706;font-weight:600;">今日期限</td>
        <td style="padding:8px 12px;border-bottom:1px solid #fef3c7;">${t.title ?? '（タイトルなし）'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #fef3c7;color:#94a3b8;">${t.due_date}</td>
      </tr>`).join('')

    const subject = overdue.length > 0
      ? `【要対応】期限切れタスクが${overdue.length}件あります — Kura`
      : `【本日期限】タスクが${dueToday.length}件あります — Kura`

    const userName = profile.display_name ?? profile.email.split('@')[0]

    await resend.emails.send({
      from: `Kura タスクアラート <${fromEmail}>`,
      to: profile.email,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1e293b;">
          <div style="background:#070E1C;padding:20px 28px;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;font-size:18px;margin:0;">Kura</h1>
            <p style="color:#94a3b8;font-size:11px;margin:3px 0 0;">タスクアラート</p>
          </div>
          <div style="background:#fff;padding:28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
            <p style="font-size:15px;">${userName} さん、おはようございます。</p>
            <p style="color:#475569;line-height:1.7;">
              本日 ${new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })} 時点で、対応が必要なタスクがあります。
            </p>

            ${overdue.length > 0 ? `
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:4px 0;margin:20px 0 12px;">
              <p style="margin:10px 12px 6px;font-size:12px;font-weight:bold;color:#dc2626;">期限切れ（${overdue.length}件）</p>
              <table style="width:100%;border-collapse:collapse;font-size:13px;">${overdueRows}</table>
            </div>` : ''}

            ${dueToday.length > 0 ? `
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:4px 0;margin:12px 0;">
              <p style="margin:10px 12px 6px;font-size:12px;font-weight:bold;color:#d97706;">今日期限（${dueToday.length}件）</p>
              <table style="width:100%;border-collapse:collapse;font-size:13px;">${todayRows}</table>
            </div>` : ''}

            <div style="text-align:center;margin:24px 0 8px;">
              <a href="https://kura-management.com/dashboard"
                style="display:inline-block;background:#2563eb;color:#fff;font-weight:bold;font-size:14px;padding:12px 32px;border-radius:10px;text-decoration:none;">
                ダッシュボードで確認する
              </a>
            </div>
          </div>
          <p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:12px;">
            © 2024 Kura. All rights reserved.
          </p>
        </div>
      `,
    })

    totalSent++
  }

  return NextResponse.json({ sent: totalSent, users: byUser.size })
}
