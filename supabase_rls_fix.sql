-- =============================================
-- RLS有効化 + ポリシー修正
-- Supabaseダッシュボード > SQL Editor で実行
-- =============================================

-- ─── RLS有効化（全コアテーブル）───────────────
ALTER TABLE companies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints       ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads            ENABLE ROW LEVEL SECURITY;

-- ─── companies ────────────────────────────────
DROP POLICY IF EXISTS "companies_select" ON companies;
DROP POLICY IF EXISTS "companies_update" ON companies;

CREATE POLICY "companies_select" ON companies
FOR SELECT USING (
  id = (SELECT company_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "companies_update" ON companies
FOR UPDATE USING (
  id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- ─── properties ───────────────────────────────
DROP POLICY IF EXISTS "properties_select" ON properties;
DROP POLICY IF EXISTS "properties_insert" ON properties;
DROP POLICY IF EXISTS "properties_update" ON properties;
DROP POLICY IF EXISTS "properties_delete" ON properties;

CREATE POLICY "properties_select" ON properties
FOR SELECT USING (
  company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "properties_insert" ON properties
FOR INSERT WITH CHECK (
  company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "properties_update" ON properties
FOR UPDATE USING (
  company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "properties_delete" ON properties
FOR DELETE USING (
  company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- ─── profiles ─────────────────────────────────
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;

CREATE POLICY "profiles_select" ON profiles
FOR SELECT USING (
  company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "profiles_update" ON profiles
FOR UPDATE USING (
  id = auth.uid()
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- ─── complaints ───────────────────────────────
DROP POLICY IF EXISTS "complaints_select" ON complaints;
DROP POLICY IF EXISTS "complaints_insert" ON complaints;
DROP POLICY IF EXISTS "complaints_update" ON complaints;
DROP POLICY IF EXISTS "complaints_delete" ON complaints;

CREATE POLICY "complaints_select" ON complaints
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = complaints.property_id
    AND properties.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "complaints_insert" ON complaints
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = complaints.property_id
    AND properties.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "complaints_update" ON complaints
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = complaints.property_id
    AND properties.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "complaints_delete" ON complaints
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = complaints.property_id
    AND properties.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);

-- ─── leads（お問い合わせ）─ Service Role のみ書き込み可
DROP POLICY IF EXISTS "leads_select" ON leads;

CREATE POLICY "leads_select" ON leads
FOR SELECT USING (false); -- 一般ユーザーは閲覧不可（管理者のみService Role経由で閲覧）
