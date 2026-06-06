import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import * as XLSX from 'xlsx'

export const runtime = 'nodejs'

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10MB

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

async function extractFromExcel(buffer: Buffer): Promise<string> {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const parts: string[] = []
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    if (workbook.SheetNames.length > 1) {
      parts.push(`=== シート：${sheetName} ===`)
    }
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false })
    if (csv.trim()) parts.push(csv.trim())
  }
  return parts.join('\n\n')
}

async function extractFromPdf(buffer: Buffer): Promise<string> {
  type PDFParseClass = new (opts: { data: Buffer }) => { getText(): Promise<{ text: string }>; destroy(): Promise<void> }
  const { PDFParse } = (await import('pdf-parse')) as unknown as { PDFParse: PDFParseClass }
  const parser = new PDFParse({ data: buffer })
  const result = await parser.getText()
  await parser.destroy()
  return result.text || ''
}

async function extractText(file: File): Promise<{ text: string; warning?: string }> {
  if (file.size > MAX_FILE_BYTES) {
    return {
      text: '',
      warning: `ファイル「${file.name}」のサイズが上限（10MB）を超えています。`,
    }
  }

  const name = file.name.toLowerCase()
  const buffer = Buffer.from(await file.arrayBuffer())

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    try {
      const text = await extractFromExcel(buffer)
      return { text }
    } catch {
      return {
        text: '',
        warning: `Excelファイル「${file.name}」の読み取りに失敗しました。テキスト貼り付けをご利用ください。`,
      }
    }
  }

  if (name.endsWith('.csv')) {
    try {
      return { text: buffer.toString('utf-8').trim() }
    } catch {
      return {
        text: '',
        warning: `CSVファイル「${file.name}」の読み取りに失敗しました。`,
      }
    }
  }

  if (name.endsWith('.pdf')) {
    try {
      const text = await extractFromPdf(buffer)
      if (!text.trim()) {
        return {
          text: '',
          warning: `PDFからテキストを読み取れませんでした。画像PDFやスキャンPDFは未対応です。テキスト貼り付けをご利用ください。`,
        }
      }
      return { text: text.trim() }
    } catch {
      return {
        text: '',
        warning: `PDFからテキストを読み取れませんでした。テキスト貼り付けをご利用ください。`,
      }
    }
  }

  return {
    text: '',
    warning: `「${file.name}」は対応していない形式です。Excel（.xlsx / .xls）・PDF・CSVをご利用ください。`,
  }
}

function mergeTexts(fileText: string, manualText: string): string {
  const a = fileText.trim()
  const b = manualText.trim()
  if (!a) return b
  if (!b) return a
  return `${a}\n\n---（補足テキスト）---\n\n${b}`
}

type VendorMeta = {
  vendorName?: unknown
  amountText?: unknown
  rawText?: unknown
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'ログインが必要です。' }, { status: 401 })
    }

    const formData = await request.formData()
    const metadataRaw = formData.get('metadata')

    if (typeof metadataRaw !== 'string') {
      return NextResponse.json({ error: 'リクエスト形式が不正です。' }, { status: 400 })
    }

    let metadata: { baseEstimateText?: unknown; vendors?: unknown[] }
    try {
      const parsed: unknown = JSON.parse(metadataRaw)
      metadata = isObject(parsed) ? (parsed as typeof metadata) : {}
    } catch {
      return NextResponse.json({ error: 'メタデータのJSON解析に失敗しました。' }, { status: 400 })
    }

    const warnings: string[] = []

    // Base estimate extraction
    const baseFile = formData.get('baseFile')
    let baseFileText = ''
    if (baseFile instanceof File && baseFile.size > 0) {
      const { text, warning } = await extractText(baseFile)
      baseFileText = text
      if (warning) warnings.push(`基準見積：${warning}`)
    }
    const baseEstimateText = mergeTexts(baseFileText, safeString(metadata.baseEstimateText))

    // Vendor estimates extraction
    const vendors: VendorMeta[] = Array.isArray(metadata.vendors)
      ? (metadata.vendors as VendorMeta[])
      : []

    const vendorTexts: { vendorName: string; extractedText: string }[] = []

    for (let i = 0; i < vendors.length; i++) {
      const vendor = vendors[i]
      const vendorName = safeString(isObject(vendor) ? vendor.vendorName : '')
      const vendorFile = formData.get(`vendor_${i}_file`)
      let vendorFileText = ''

      if (vendorFile instanceof File && vendorFile.size > 0) {
        const { text, warning } = await extractText(vendorFile)
        vendorFileText = text
        if (warning) warnings.push(`${vendorName || `業者${i + 1}`}：${warning}`)
      }

      const rawText = isObject(vendor) ? safeString(vendor.rawText) : ''
      const extractedText = mergeTexts(vendorFileText, rawText)
      vendorTexts.push({ vendorName, extractedText })
    }

    return NextResponse.json({ baseEstimateText, vendorTexts, warnings })
  } catch (err) {
    console.error('estimate-comparison extract error', err)
    return NextResponse.json({ error: '読み取り処理に失敗しました。' }, { status: 500 })
  }
}
