-- ================================================================
-- 無料AI議事録 マイグレーション
-- Supabase SQL Editorで実行してください
-- ================================================================

-- 1. companies テーブルに source カラム追加
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT NULL;

-- 2. 月別利用状況テーブル
CREATE TABLE IF NOT EXISTS free_minutes_usage (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month     TEXT NOT NULL,            -- 例: '2026-08'
  used_count     INTEGER NOT NULL DEFAULT 0,
  survey_bonus_granted BOOLEAN NOT NULL DEFAULT false,
  survey_answered_at   TIMESTAMPTZ,
  kura_cta_clicked     BOOLEAN NOT NULL DEFAULT false,
  first_used_at  TIMESTAMPTZ,
  last_used_at   TIMESTAMPTZ,
  UNIQUE(user_id, year_month)
);

ALTER TABLE free_minutes_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own usage" ON free_minutes_usage
  FOR SELECT USING (auth.uid() = user_id);

-- サービスロールのみ更新可能（APIからはService Roleキーで操作する）

-- 3. アンケート回答テーブル
CREATE TABLE IF NOT EXISTS free_minutes_surveys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month    TEXT NOT NULL,
  q1_usability  TEXT NOT NULL,   -- 'ready' | 'minor_edit' | 'major_edit' | 'not_useful'
  q2_current_time TEXT NOT NULL, -- 'lt30' | '30to60' | '60to120' | '120to180' | 'gt180'
  q3_kura_interest TEXT NOT NULL,-- 'yes' | 'try' | 'more_info' | 'not_interested'
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, year_month)
);

ALTER TABLE free_minutes_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own surveys" ON free_minutes_surveys
  FOR SELECT USING (auth.uid() = user_id);

-- 4. 利用回数アトミックインクリメント関数
CREATE OR REPLACE FUNCTION increment_free_minutes_usage(
  p_user_id UUID,
  p_year_month TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO free_minutes_usage (user_id, year_month, used_count, first_used_at, last_used_at)
    VALUES (p_user_id, p_year_month, 1, now(), now())
  ON CONFLICT (user_id, year_month)
    DO UPDATE SET
      used_count = free_minutes_usage.used_count + 1,
      first_used_at = COALESCE(free_minutes_usage.first_used_at, now()),
      last_used_at = now();
END;
$$;

-- 5. Storageバケット: free_minutesユーザーもKura-filesへアップロードできるよう確認
-- （既存バケットがある場合はこのポリシーを追加）
-- INSERT INTO storage.buckets (id, name) VALUES ('Kura-files', 'Kura-files') ON CONFLICT DO NOTHING;

-- 5. インデックス
CREATE INDEX IF NOT EXISTS idx_free_minutes_usage_user_month
  ON free_minutes_usage(user_id, year_month);

CREATE INDEX IF NOT EXISTS idx_free_minutes_surveys_user_month
  ON free_minutes_surveys(user_id, year_month);

CREATE INDEX IF NOT EXISTS idx_companies_source
  ON companies(source) WHERE source IS NOT NULL;
