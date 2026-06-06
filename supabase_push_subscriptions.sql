-- プッシュ通知サブスクリプション管理テーブル
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_own"
  ON push_subscriptions FOR ALL
  USING (user_id = auth.uid());

-- 通知送信ログ（送りすぎ防止）
CREATE TABLE IF NOT EXISTS push_notification_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id     UUID,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_id, sent_at::date)
);

ALTER TABLE push_notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_notification_logs_own"
  ON push_notification_logs FOR ALL
  USING (user_id = auth.uid());
