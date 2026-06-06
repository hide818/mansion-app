import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

function parseCSV(text: string): Record<string, string>[] {
  const cleaned = text.replace(/\r/g, '')
  const lines = cleaned.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^﻿/, ''))
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

const TYPE_MAP: Record<string, string> = {
  'エレベーター': 'elevator', 'elevator': 'elevator',
  '消防': 'fire', '消防設備': 'fire', 'fire': 'fire',
  '建築物': 'building_survey', '特定建築物': 'building_survey',
  '建築設備': 'building_equipment',
  '貯水槽': 'water_tank', '水槽': 'water_tank',
  '水質': 'water_quality',
  '排水管': 'drainage', '排水': 'drainage',
  '駐車場': 'parking', '機械式駐車場': 'parking',
  '電気': 'electrical', '電気設備': 'electrical',
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 })

  const text = await file.text()
  const rows = parseCSV(text)

  const { data: props } = await supabase
    .from('properties').select('id, name').eq('company_id', companyId)
  const propMap = new Map((props ?? []).map(p => [p.name, p.id]))

  const results = { inserted: 0, skipped: 0, errors: [] as string[] }

  for (const row of rows) {
    const inspectionName = row['点検名称'] || row['name'] || ''
    const nextDueDate = row['次回期限'] || row['next_due_date'] || ''
    if (!inspectionName || !nextDueDate) { results.skipped++; continue }

    const propertyName = row['物件名'] || ''
    const propertyId = propMap.get(propertyName) ?? null
    if (!propertyId) { results.errors.push(`${inspectionName}: 物件「${propertyName}」が見つかりません`); results.skipped++; continue }

    const typeKey = row['点検種別'] || row['type'] || 'other'
    const inspectionType = TYPE_MAP[typeKey] ?? 'other'

    const { error } = await supabase.from('inspections').insert({
      company_id: companyId,
      property_id: propertyId,
      inspection_type: inspectionType,
      inspection_name: inspectionName,
      next_due_date: nextDueDate,
      last_inspection_date: row['前回実施日'] || null,
      frequency_months: row['頻度(月)'] ? parseInt(row['頻度(月)']) : 12,
      notes: row['備考'] || null,
    })

    if (error) {
      results.errors.push(`${inspectionName}: ${error.message}`)
      results.skipped++
    } else {
      results.inserted++
    }
  }

  return NextResponse.json(results)
}
