-- Phase 2: 法定点検・居住者DB・業者・修繕・見積・居住者問い合わせ
-- Supabase SQL Editor で実行してください

-- 1. 業者マスタ（他テーブルが参照するので先に作成）
CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  categories TEXT[] DEFAULT '{}',  -- ['elevator','fire','cleaning','construction','electrical','water']
  phone TEXT,
  email TEXT,
  address TEXT,
  contact_person TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company isolation" ON contractors
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- 2. 戸室テーブル（物件の中の各部屋）
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  unit_number TEXT NOT NULL,  -- '101', '201' など
  floor INTEGER,
  area_sqm DECIMAL(6,2),
  layout TEXT,  -- '2LDK', '3LDK' など
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company isolation" ON units
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- 3. 居住者テーブル（区分所有者・賃借人）
CREATE TABLE IF NOT EXISTS residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  property_id UUID NOT NULL,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  name_kana TEXT,
  phone TEXT,
  email TEXT,
  resident_type TEXT NOT NULL DEFAULT 'owner',  -- 'owner'=区分所有者, 'tenant'=賃借人
  is_board_member BOOLEAN DEFAULT FALSE,
  board_role TEXT,  -- '理事長','副理事長','理事','監事'
  move_in_date DATE,
  move_out_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company isolation" ON residents
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- インデックス（検索高速化）
CREATE INDEX IF NOT EXISTS idx_residents_property ON residents(property_id);
CREATE INDEX IF NOT EXISTS idx_residents_company ON residents(company_id);
CREATE INDEX IF NOT EXISTS idx_units_property ON units(property_id);

-- 4. 法定点検テーブル
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  inspection_type TEXT NOT NULL,
  -- 'elevator'=エレベーター定期検査
  -- 'fire'=消防設備点検
  -- 'building_survey'=特定建築物定期調査
  -- 'building_equipment'=建築設備定期検査
  -- 'water_tank'=貯水槽清掃
  -- 'water_quality'=水質検査
  -- 'drainage'=排水管清掃
  -- 'parking'=機械式駐車場点検
  -- 'electrical'=電気設備点検
  -- 'other'=その他
  inspection_name TEXT NOT NULL,
  contractor_id UUID REFERENCES contractors(id),
  last_inspection_date DATE,
  next_due_date DATE NOT NULL,
  frequency_months INTEGER,  -- 6=半年, 12=1年, 36=3年
  status TEXT DEFAULT 'pending',  -- 'pending', 'completed', 'overdue'
  result TEXT,  -- '適合', '不適合', '要是正指示あり'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company isolation" ON inspections
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_inspections_company ON inspections(company_id);
CREATE INDEX IF NOT EXISTS idx_inspections_due_date ON inspections(next_due_date);

-- 5. 修繕履歴テーブル
CREATE TABLE IF NOT EXISTS repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  contractor_id UUID REFERENCES contractors(id),
  title TEXT NOT NULL,
  category TEXT,
  -- '共用部修繕','設備修繕','大規模修繕','緊急修繕','予防保全','植栽管理','清掃'
  amount DECIMAL(12,0),
  start_date DATE,
  completion_date DATE,
  status TEXT DEFAULT 'planned',  -- 'planned','in_progress','completed'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company isolation" ON repairs
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_repairs_property ON repairs(property_id);
CREATE INDEX IF NOT EXISTS idx_repairs_company ON repairs(company_id);

-- 6. 見積テーブル
CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  case_id UUID REFERENCES cases(id),
  company_id UUID NOT NULL,
  contractor_id UUID REFERENCES contractors(id),
  title TEXT NOT NULL,
  amount DECIMAL(12,0),
  submitted_date DATE,
  validity_date DATE,
  status TEXT DEFAULT 'pending',  -- 'pending','accepted','rejected'
  items JSONB DEFAULT '[]',  -- [{name, quantity, unit, unit_price, amount}]
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company isolation" ON estimates
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_estimates_property ON estimates(property_id);
CREATE INDEX IF NOT EXISTS idx_estimates_company ON estimates(company_id);

-- 7. 居住者問い合わせテーブル
CREATE TABLE IF NOT EXISTS resident_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  unit_id UUID REFERENCES units(id),
  company_id UUID NOT NULL,
  resident_id UUID REFERENCES residents(id),
  title TEXT NOT NULL,
  category TEXT DEFAULT 'inquiry',
  -- 'repair'=修繕要望, 'complaint'=クレーム, 'inquiry'=問い合わせ, 'other'=その他
  description TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  -- 'new'=新規, 'in_progress'=対応中, 'resolved'=解決済み, 'closed'=完了
  priority TEXT DEFAULT 'normal',  -- 'low','normal','high','urgent'
  assigned_to UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE resident_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company isolation" ON resident_requests
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_resident_requests_company ON resident_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_resident_requests_status ON resident_requests(status);
