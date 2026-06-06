-- ファイル添付機能: 見積書・法定点検報告書の保管
-- Supabase SQL Editor で実行してください

-- 見積テーブルにファイルカラム追加
ALTER TABLE estimates
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT;

-- 法定点検テーブルに報告書カラム追加
ALTER TABLE inspections
  ADD COLUMN IF NOT EXISTS report_file_path TEXT,
  ADD COLUMN IF NOT EXISTS report_file_name TEXT;

-- ※ ストレージバケットは Supabase Dashboard > Storage から作成してください
-- バケット名: kura-files（Private設定）
