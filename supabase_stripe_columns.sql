-- Stripe 連携用カラムを companies テーブルに追加
-- Supabase SQL Editor で実行してください（supabase_plan_column.sql の後に実行）

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
