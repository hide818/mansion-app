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

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const companyId = await getUserCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 })

  const text = await file.text()
  const rows = parseCSV(text)

  // 自社物件を全取得（物件名→IDのマップ）
  const { data: props } = await supabase
    .from('properties').select('id, name').eq('company_id', companyId)
  const propMap = new Map((props ?? []).map(p => [p.name, p.id]))

  const results = { inserted: 0, skipped: 0, errors: [] as string[] }

  for (const row of rows) {
    const name = row['氏名'] || row['name'] || ''
    if (!name) { results.skipped++; continue }

    const propertyName = row['物件名'] || row['property'] || ''
    const propertyId = propMap.get(propertyName) ?? null

    // 戸室を取得または作成
    let unitId: string | null = null
    const unitNumber = row['部屋番号'] || row['unit'] || ''
    if (propertyId && unitNumber) {
      const { data: existingUnit } = await supabase
        .from('units').select('id')
        .eq('property_id', propertyId).eq('unit_number', unitNumber).maybeSingle()

      if (existingUnit) {
        unitId = existingUnit.id
      } else {
        const { data: newUnit } = await supabase.from('units').insert({
          property_id: propertyId,
          company_id: companyId,
          unit_number: unitNumber,
        }).select('id').single()
        unitId = newUnit?.id ?? null
      }
    }

    const residentType = row['種別'] === '賃借人' || row['type'] === 'tenant' ? 'tenant' : 'owner'
    const isBoardMember = row['理事会'] === 'yes' || row['理事会'] === '○' || row['理事会'] === '✓'

    const { error } = await supabase.from('residents').insert({
      company_id: companyId,
      property_id: propertyId,
      unit_id: unitId,
      name,
      name_kana: row['フリガナ'] || row['kana'] || null,
      phone: row['電話番号'] || row['phone'] || null,
      email: row['メール'] || row['email'] || null,
      resident_type: residentType,
      is_board_member: isBoardMember,
      board_role: row['役職'] || null,
    })

    if (error) {
      results.errors.push(`${name}: ${error.message}`)
      results.skipped++
    } else {
      results.inserted++
    }
  }

  return NextResponse.json(results)
}
