import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? ''
const VAPID_EMAIL = process.env.VAPID_EMAIL ?? 'mailto:admin@kura.app'
const CRON_SECRET = process.env.CRON_SECRET ?? ''

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE)
}

// このエンドポイントはVercel Cronまたは外部cronサービスから呼び出す
// Authorization: Bearer <CRON_SECRET> が必要
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return NextResponse.json({ error: 'VAPID keys 未設定' }, { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const today = new Date().toISOString().slice(0, 10)

  // 今日期限・期限切れタスクを持つユーザーを取得
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, assigned_to, due_date, status')
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

  let totalSent = 0

  for (const [userId, userTasks] of byUser) {
    // 今日すでに送信済みかチェック
    const alreadySentIds = new Set<string>()
    const { data: logs } = await supabase
      .from('push_notification_logs')
      .select('task_id')
      .eq('user_id', userId)
      .gte('sent_at', `${today}T00:00:00Z`)

    for (const log of logs ?? []) {
      if (log.task_id) alreadySentIds.add(log.task_id)
    }

    const newTasks = userTasks.filter((t) => !alreadySentIds.has(t.id))
    if (newTasks.length === 0) continue

    // プッシュサブスクリプション取得
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId)

    if (!subs || subs.length === 0) continue

    const overdueCount = newTasks.filter((t) => t.due_date < today).length
    const todayCount = newTasks.filter((t) => t.due_date === today).length

    const body = [
      overdueCount > 0 ? `期限切れ ${overdueCount}件` : '',
      todayCount > 0 ? `今日期限 ${todayCount}件` : '',
    ].filter(Boolean).join('、')

    const payload = JSON.stringify({
      title: 'Kura タスクアラート',
      body,
      url: '/dashboard',
      urgent: overdueCount > 0,
    })

    // 通知送信
    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
      )
    )
    const sent = results.filter((r) => r.status === 'fulfilled').length
    totalSent += sent

    // 送信ログ保存
    if (sent > 0) {
      await supabase.from('push_notification_logs').insert(
        newTasks.map((t) => ({ user_id: userId, task_id: t.id }))
      )
    }
  }

  return NextResponse.json({ sent: totalSent, users: byUser.size })
}
