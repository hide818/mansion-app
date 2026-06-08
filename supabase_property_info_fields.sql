-- =============================================
-- 物件情報フィールド追加
-- =============================================

ALTER TABLE public.properties
  -- 建物基本
  ADD COLUMN IF NOT EXISTS built_year           INTEGER,
  ADD COLUMN IF NOT EXISTS structure            TEXT,        -- 'RC' | 'SRC' | 'S造' | '木造' など
  ADD COLUMN IF NOT EXISTS total_units          INTEGER,
  ADD COLUMN IF NOT EXISTS total_floors         INTEGER,

  -- 管理組合
  ADD COLUMN IF NOT EXISTS association_name     TEXT,
  ADD COLUMN IF NOT EXISTS president_name       TEXT,
  ADD COLUMN IF NOT EXISTS president_phone      TEXT,
  ADD COLUMN IF NOT EXISTS president_email      TEXT,
  ADD COLUMN IF NOT EXISTS board_frequency      TEXT,        -- '月1回' | '隔月' など
  ADD COLUMN IF NOT EXISTS general_meeting_month INTEGER,    -- 1〜12

  -- 財務
  ADD COLUMN IF NOT EXISTS management_fee       INTEGER,     -- 月額/戸（円）
  ADD COLUMN IF NOT EXISTS repair_reserve       INTEGER,     -- 月額/戸（円）
  ADD COLUMN IF NOT EXISTS reserve_balance      BIGINT,      -- 修繕積立金残高（円）
  ADD COLUMN IF NOT EXISTS repair_plan_year     INTEGER,     -- 長期修繕計画次回改定年

  -- 契約
  ADD COLUMN IF NOT EXISTS contract_start       DATE,
  ADD COLUMN IF NOT EXISTS contract_renewal     DATE,

  -- 主要業者
  ADD COLUMN IF NOT EXISTS cleaning_company     TEXT,
  ADD COLUMN IF NOT EXISTS elevator_company     TEXT,
  ADD COLUMN IF NOT EXISTS insurance_company    TEXT;
