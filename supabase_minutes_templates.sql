-- Supabase管理画面のSQL Editorで実行してください
-- 議事録フォーマットテンプレートテーブル

CREATE TABLE IF NOT EXISTS minutes_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL,
  name        TEXT NOT NULL,
  sample_text TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE minutes_templates ENABLE ROW LEVEL SECURITY;

-- 同一company_idのユーザーのみアクセス可能
CREATE POLICY "minutes_templates_company_isolation"
  ON minutes_templates
  FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
