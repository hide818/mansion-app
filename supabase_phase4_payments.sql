-- Phase 4: 管理費未払い督促管理
-- Supabase SQL Editor で実行してください

CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  billing_year INTEGER NOT NULL,
  billing_month INTEGER NOT NULL,  -- 1〜12
  management_fee INTEGER DEFAULT 0,   -- 管理費
  reserve_fund INTEGER DEFAULT 0,     -- 修繕積立金
  other_fee INTEGER DEFAULT 0,        -- その他費用
  paid_amount INTEGER DEFAULT 0,      -- 入金額
  payment_date DATE,
  status TEXT DEFAULT 'unpaid',       -- 'unpaid','partial','paid'
  dunning_count INTEGER DEFAULT 0,    -- 督促回数
  last_dunning_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(unit_id, billing_year, billing_month)
);

ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company isolation" ON payment_records
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_payments_property ON payment_records(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_company ON payment_records(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_records(status);
CREATE INDEX IF NOT EXISTS idx_payments_billing ON payment_records(billing_year, billing_month);
