-- 勘定科目マスタ（会社ごとにカスタム）
create table if not exists account_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table account_categories enable row level security;
create policy "company members can manage account_categories"
  on account_categories for all
  using (company_id = (select company_id from profiles where id = auth.uid()));

-- 事業計画
create table if not exists business_plans (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  fiscal_year int not null,
  name text not null,
  budget_amount bigint,
  account_category_id uuid references account_categories(id) on delete set null,
  contractor text,
  scheduled_date date,
  status text not null default '未着手' check (status in ('未着手','進行中','完了','延期')),
  actual_amount bigint,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table business_plans enable row level security;
create policy "company members can manage business_plans"
  on business_plans for all
  using (company_id = (select company_id from profiles where id = auth.uid()));

-- デフォルト勘定科目（初回ユーザー向けサンプル）
-- ユーザーが会社登録後に手動または自動で追加
