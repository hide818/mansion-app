import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 物件
  const { data: props } = await supabase.from('properties').insert([
    { company_id: companyId, name: 'サンプル：グランドパレス新宿', address: '東京都新宿区西新宿1-1-1' },
    { company_id: companyId, name: 'サンプル：ガーデンヒルズ渋谷', address: '東京都渋谷区渋谷2-2-2' },
    { company_id: companyId, name: 'サンプル：シティタワー品川', address: '東京都品川区港南3-3-3' },
  ]).select()

  if (!props?.length) return NextResponse.json({ error: '物件の作成に失敗しました' }, { status: 500 })

  const [p1, p2, p3] = props

  // 業者
  const { data: contractors } = await supabase.from('contractors').insert([
    { company_id: companyId, name: '東京エレベーター保守㈱', categories: ['elevator'], phone: '03-1111-2222', contact_person: '鈴木 健一' },
    { company_id: companyId, name: '関東消防設備㈱', categories: ['fire'], phone: '03-3333-4444', contact_person: '田中 誠' },
    { company_id: companyId, name: '㈱総合ビルメンテナンス', categories: ['cleaning', 'drainage', 'water_tank'], phone: '03-5555-6666', contact_person: '佐藤 裕子' },
    { company_id: companyId, name: '㈱都市建設工業', categories: ['construction'], phone: '03-7777-8888', contact_person: '高橋 大輔' },
  ]).select()

  const con = contractors ?? []

  // 戸室（p1: 6戸、p2: 4戸）
  const unitData = [
    ...['101','102','201','202','301','302'].map(n => ({ property_id: p1.id, company_id: companyId, unit_number: n, floor: parseInt(n[0]), layout: n.endsWith('1') ? '3LDK' : '2LDK' })),
    ...['101','102','201','202'].map(n => ({ property_id: p2.id, company_id: companyId, unit_number: n, floor: parseInt(n[0]), layout: '2LDK' })),
  ]
  const { data: units } = await supabase.from('units').insert(unitData).select()
  const u = units ?? []

  // 居住者
  const residents = [
    { unit_id: u[0]?.id, property_id: p1.id, company_id: companyId, name: '山田 太郎', name_kana: 'ヤマダ タロウ', phone: '090-1111-1111', email: 'yamada@example.com', resident_type: 'owner', is_board_member: true, board_role: '理事長' },
    { unit_id: u[1]?.id, property_id: p1.id, company_id: companyId, name: '佐藤 花子', name_kana: 'サトウ ハナコ', phone: '090-2222-2222', resident_type: 'owner', is_board_member: true, board_role: '副理事長' },
    { unit_id: u[2]?.id, property_id: p1.id, company_id: companyId, name: '鈴木 一郎', name_kana: 'スズキ イチロウ', phone: '090-3333-3333', resident_type: 'owner', is_board_member: false },
    { unit_id: u[3]?.id, property_id: p1.id, company_id: companyId, name: '田中 美子', name_kana: 'タナカ ヨシコ', phone: '090-4444-4444', resident_type: 'tenant', is_board_member: false },
    { unit_id: u[4]?.id, property_id: p1.id, company_id: companyId, name: '高橋 健二', name_kana: 'タカハシ ケンジ', phone: '090-5555-5555', resident_type: 'owner', is_board_member: true, board_role: '監事' },
    { unit_id: u[5]?.id, property_id: p1.id, company_id: companyId, name: '渡辺 さくら', name_kana: 'ワタナベ サクラ', phone: '090-6666-6666', resident_type: 'owner', is_board_member: false },
    { unit_id: u[6]?.id, property_id: p2.id, company_id: companyId, name: '小林 正雄', name_kana: 'コバヤシ マサオ', phone: '090-7777-7777', resident_type: 'owner', is_board_member: true, board_role: '理事長' },
    { unit_id: u[7]?.id, property_id: p2.id, company_id: companyId, name: '加藤 幸子', name_kana: 'カトウ サチコ', phone: '090-8888-8888', resident_type: 'owner', is_board_member: false },
  ]
  await supabase.from('residents').insert(residents)

  // 法定点検
  const now = new Date()
  const inspections = [
    { property_id: p1.id, company_id: companyId, inspection_type: 'elevator', inspection_name: 'エレベーター定期検査（1号機）', next_due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5).toISOString().split('T')[0], last_inspection_date: '2025-06-30', frequency_months: 12, contractor_id: con[0]?.id, status: 'pending' },
    { property_id: p1.id, company_id: companyId, inspection_type: 'fire', inspection_name: '消防設備点検（春期）', next_due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15).toISOString().split('T')[0], last_inspection_date: '2025-12-15', frequency_months: 6, contractor_id: con[1]?.id },
    { property_id: p1.id, company_id: companyId, inspection_type: 'water_tank', inspection_name: '貯水槽清掃・水質検査', next_due_date: new Date(now.getFullYear(), now.getMonth() + 2, 28).toISOString().split('T')[0], last_inspection_date: '2025-08-28', frequency_months: 12, contractor_id: con[2]?.id },
    { property_id: p1.id, company_id: companyId, inspection_type: 'drainage', inspection_name: '排水管清掃', next_due_date: new Date(now.getFullYear(), now.getMonth() + 1, 15).toISOString().split('T')[0], frequency_months: 12, contractor_id: con[2]?.id },
    { property_id: p2.id, company_id: companyId, inspection_type: 'fire', inspection_name: '消防設備点検（秋期）', next_due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).toISOString().split('T')[0], frequency_months: 6, contractor_id: con[1]?.id, status: 'pending' },
    { property_id: p2.id, company_id: companyId, inspection_type: 'elevator', inspection_name: 'エレベーター定期検査', next_due_date: new Date(now.getFullYear(), now.getMonth() + 4, 30).toISOString().split('T')[0], frequency_months: 12, contractor_id: con[0]?.id },
    { property_id: p3.id, company_id: companyId, inspection_type: 'building_survey', inspection_name: '特定建築物定期調査', next_due_date: new Date(now.getFullYear() + 1, 2, 31).toISOString().split('T')[0], frequency_months: 36 },
  ]
  await supabase.from('inspections').insert(inspections)

  // 修繕履歴
  await supabase.from('repairs').insert([
    { property_id: p1.id, company_id: companyId, title: '外壁塗装工事', category: '大規模修繕', amount: 28000000, start_date: '2023-04-01', completion_date: '2023-09-30', status: 'completed', contractor_id: con[3]?.id, description: '12年目の大規模修繕工事。外壁・屋上防水・鉄部塗装含む。' },
    { property_id: p1.id, company_id: companyId, title: 'エントランス照明LED化', category: '設備修繕', amount: 850000, start_date: '2024-11-01', completion_date: '2024-11-15', status: 'completed', contractor_id: con[2]?.id },
    { property_id: p1.id, company_id: companyId, title: '給水ポンプ交換', category: '設備修繕', amount: 1200000, start_date: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0], status: 'planned', contractor_id: con[3]?.id },
    { property_id: p2.id, company_id: companyId, title: '屋上防水工事', category: '共用部修繕', amount: 4500000, start_date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0], status: 'in_progress', contractor_id: con[3]?.id },
  ])

  // 管理費支払い記録（p1の6戸、今月分・一部未払い）
  const y = now.getFullYear(), m = now.getMonth() + 1
  const paymentData = u.slice(0, 6).map((unit, i) => ({
    unit_id: unit.id,
    property_id: p1.id,
    company_id: companyId,
    billing_year: y,
    billing_month: m,
    management_fee: 18000,
    reserve_fund: 8000,
    other_fee: 0,
    paid_amount: i < 4 ? 26000 : 0,
    status: i < 4 ? 'paid' : 'unpaid',
    payment_date: i < 4 ? new Date(y, m - 1, i + 1).toISOString().split('T')[0] : null,
    dunning_count: i === 5 ? 1 : 0,
  }))
  await supabase.from('payment_records').upsert(paymentData, { onConflict: 'unit_id,billing_year,billing_month' })

  // 案件・タスク
  const { data: cases } = await supabase.from('cases').insert([
    { property_id: p1.id, company_id: companyId, title: '給水ポンプ交換の業者選定', status: 'open', priority: 'high' },
    { property_id: p1.id, company_id: companyId, title: '第35回定期総会の準備', status: 'open', priority: 'urgent' },
    { property_id: p2.id, company_id: companyId, title: '屋上防水工事の進捗確認', status: 'in_progress', priority: 'normal' },
  ]).select()

  if (cases?.length) {
    await supabase.from('tasks').insert([
      { case_id: cases[0].id, property_id: p1.id, company_id: companyId, title: '相見積もり3社に依頼', status: 'todo', due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString().split('T')[0] },
      { case_id: cases[1].id, property_id: p1.id, company_id: companyId, title: '招集通知の起案', status: 'todo', due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2).toISOString().split('T')[0] },
      { case_id: cases[1].id, property_id: p1.id, company_id: companyId, title: '議案書の作成', status: 'in_progress', due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14).toISOString().split('T')[0] },
      { case_id: cases[2].id, property_id: p2.id, company_id: companyId, title: '現場写真の撮影', status: 'done', due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5).toISOString().split('T')[0] },
    ])
  }

  // 居住者問い合わせ
  await supabase.from('resident_requests').insert([
    { property_id: p1.id, company_id: companyId, title: '301号室 洗面台の排水が遅い', category: 'repair', description: '洗面台の排水が詰まり気味とのことでご連絡。業者手配が必要。', status: 'new', priority: 'normal' },
    { property_id: p1.id, company_id: companyId, title: '駐輪場の照明が切れている', category: 'repair', description: '地下駐輪場B区画の照明が切れており暗くて危険とのクレームあり。', status: 'in_progress', priority: 'high' },
    { property_id: p2.id, company_id: companyId, title: '上階からの騒音について', category: 'complaint', description: '201号室の居住者より、上階（202）の深夜の足音が気になるとのご相談。', status: 'new', priority: 'normal' },
  ])

  return NextResponse.json({ ok: true, message: 'サンプルデータを投入しました' })
}
