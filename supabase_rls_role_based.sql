-- =============================================
-- 役割ベースのアクセス制御
-- 管理者（admin）: 会社全体の全データを閲覧可
-- 一般・閲覧者（general/viewer）: 自分担当のデータのみ閲覧可
-- =============================================

-- ─── cases ───────────────────────────────────
DROP POLICY IF EXISTS "company isolation" ON cases;
DROP POLICY IF EXISTS "cases_select" ON cases;
DROP POLICY IF EXISTS "cases_write" ON cases;
DROP POLICY IF EXISTS "cases_update" ON cases;
DROP POLICY IF EXISTS "cases_delete" ON cases;

-- SELECT: 管理者は全件 / それ以外は assigned_to = 自分のみ
CREATE POLICY "cases_select" ON cases
FOR SELECT USING (
  company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    OR assigned_to = auth.uid()
  )
);

-- 書き込み: 会社内であれば可（役割制限なし）
CREATE POLICY "cases_insert" ON cases
FOR INSERT WITH CHECK (
  company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "cases_update" ON cases
FOR UPDATE USING (
  company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "cases_delete" ON cases
FOR DELETE USING (
  company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
);

-- ─── tasks ────────────────────────────────────
DROP POLICY IF EXISTS "company isolation" ON tasks;
DROP POLICY IF EXISTS "tasks_select" ON tasks;
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_update" ON tasks;
DROP POLICY IF EXISTS "tasks_delete" ON tasks;

-- SELECT: 管理者は全件 / それ以外は assigned_to = 自分のみ
CREATE POLICY "tasks_select" ON tasks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM cases
    WHERE cases.id = tasks.case_id
    AND cases.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    AND (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
      OR cases.assigned_to = auth.uid()
    )
  )
);

CREATE POLICY "tasks_insert" ON tasks
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM cases
    WHERE cases.id = tasks.case_id
    AND cases.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "tasks_update" ON tasks
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM cases
    WHERE cases.id = tasks.case_id
    AND cases.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "tasks_delete" ON tasks
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM cases
    WHERE cases.id = tasks.case_id
    AND cases.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);

-- ─── logs ─────────────────────────────────────
DROP POLICY IF EXISTS "company isolation" ON logs;
DROP POLICY IF EXISTS "logs_select" ON logs;
DROP POLICY IF EXISTS "logs_insert" ON logs;

CREATE POLICY "logs_select" ON logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM cases
    WHERE cases.id = logs.case_id
    AND cases.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    AND (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
      OR cases.assigned_to = auth.uid()
    )
  )
);

CREATE POLICY "logs_insert" ON logs
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM cases
    WHERE cases.id = logs.case_id
    AND cases.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);
