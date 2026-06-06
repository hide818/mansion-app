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
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 })

  const text = await file.text()
  const rows = parseCSV(text)

  const results = { inserted: 0, skipped: 0, errors: [] as string[] }

  for (const row of rows) {
    const name = row['物件名'] || row['name'] || ''
    if (!name) { results.skipped++; continue }

    const { error } = await supabase.from('properties').insert({
      company_id: companyId,
      name,
      address: row['住所'] || row['address'] || null,
      total_units: row['戸数'] ? parseInt(row['戸数']) : null,
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
