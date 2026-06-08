-- companies テーブルにプランカラムを追加
-- Supabase SQL Editor で実行してください

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days');

-- plan の値: 'trial' | 'starter' | 'standard' | 'enterprise'
-- trial_ends_at: トライアル期限（trial プランのみ参照）

-- 既存レコードはすべて trial に設定済み（DEFAULT の効果）
