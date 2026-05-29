'use client'

import { useEffect, useMemo, useState } from 'react'

type EstimateComparisonCenterClientProps = {
  propertyId: string
  caseId: string
  propertyName: string
  caseTitle: string
}

type BannerType = 'success' | 'error' | 'info'

type BannerState = {
  type: BannerType
  text: string
} | null

type EstimateVendorInput = {
  id: string
  vendorName: string
  headline: string
  estimateText: string
  priceText: string
  notes: string
  enabled: boolean
}

type ComparisonTableRow = {
  item: string
  vendorA: string
  vendorB: string
  vendorC: string
  comment: string
}

type EstimateComparisonResult = {
  summary: string
  recommendedVendor: string
  recommendedReason: string
  strengths: string[]
  cautions: string[]
  questions: string[]
  comparisonTable: ComparisonTableRow[]
  comparisonComment: string
  boardComment: string
  bossComment: string
  vendorQuestionText: string
  recommendationMemo: string
}

type EstimateComparisonRecord = {
  id: string
  title: string
  status: 'draft' | 'final'
  updatedAt: string
  vendors: EstimateVendorInput[]
  result: EstimateComparisonResult | null
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function createVendor(index: number): EstimateVendorInput {
  return {
    id: `vendor-${index}`,
    vendorName: `業者${index}`,
    headline: '',
    estimateText: '',
    priceText: '',
    notes: '',
    enabled: true,
  }
}

function createInitialVendors(): EstimateVendorInput[] {
  return [createVendor(1), createVendor(2), createVendor(3)]
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => safeString(item)).filter(Boolean)
}

function normalizeComparisonTable(value: unknown): ComparisonTableRow[] {
  if (!Array.isArray(value)) return []

  return value.map((row) => {
    const source = isObject(row) ? row : {}

    return {
      item: safeString(source.item),
      vendorA: safeString(source.vendorA ?? source.vendor_a),
      vendorB: safeString(source.vendorB ?? source.vendor_b),
      vendorC: safeString(source.vendorC ?? source.vendor_c),
      comment: safeString(source.comment),
    }
  })
}

function normalizeEstimateComparisonResult(
  raw: unknown
): EstimateComparisonResult | null {
  if (!isObject(raw)) return null

  const resultSource = isObject(raw.result) ? raw.result : raw

  return {
    summary: safeString(resultSource.summary),
    recommendedVendor: safeString(
      resultSource.recommendedVendor ?? resultSource.recommended_vendor
    ),
    recommendedReason: safeString(
      resultSource.recommendedReason ?? resultSource.recommended_reason
    ),
    strengths: safeStringArray(resultSource.strengths),
    cautions: safeStringArray(resultSource.cautions),
    questions: safeStringArray(resultSource.questions),
    comparisonTable: normalizeComparisonTable(
      resultSource.comparisonTable ?? resultSource.comparison_table
    ),
    comparisonComment: safeString(
      resultSource.comparisonComment ?? resultSource.comparison_comment
    ),
    boardComment: safeString(
      resultSource.boardComment ?? resultSource.board_comment
    ),
    bossComment: safeString(
      resultSource.bossComment ?? resultSource.boss_comment
    ),
    vendorQuestionText: safeString(
      resultSource.vendorQuestionText ?? resultSource.vendor_question_text
    ),
    recommendationMemo: safeString(
      resultSource.recommendationMemo ?? resultSource.recommendation_memo
    ),
  }
}

function normalizeVendorList(raw: unknown): EstimateVendorInput[] {
  if (!Array.isArray(raw)) return createInitialVendors()

  const mapped = raw.map((item, index) => {
    const source = isObject(item) ? item : {}

    return {
      id: safeString(source.id) || `vendor-${index + 1}`,
      vendorName: safeString(source.vendorName ?? source.vendor_name),
      headline: safeString(source.headline),
      estimateText: safeString(source.estimateText ?? source.estimate_text),
      priceText: safeString(source.priceText ?? source.price_text),
      notes: safeString(source.notes),
      enabled:
        typeof source.enabled === 'boolean'
          ? source.enabled
          : typeof source.isEnabled === 'boolean'
            ? source.isEnabled
            : true,
    }
  })

  if (mapped.length >= 3) return mapped

  const filled = [...mapped]
  while (filled.length < 3) {
    filled.push(createVendor(filled.length + 1))
  }

  return filled
}

function normalizeEstimateComparisonRecord(
  raw: unknown
): EstimateComparisonRecord | null {
  if (!isObject(raw)) return null

  return {
    id: safeString(raw.id),
    title: safeString(raw.title ?? raw.comparison_name),
    status: safeString(raw.status) === 'final' ? 'final' : 'draft',
    updatedAt: safeString(raw.updatedAt ?? raw.updated_at),
    vendors: normalizeVendorList(raw.vendors),
    result: normalizeEstimateComparisonResult(raw.result),
  }
}

function formatDateTime(value: string) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getStatusBadgeClass(status: 'draft' | 'final') {
  return status === 'final'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-amber-200 bg-amber-50 text-amber-700'
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildEstimateComparisonMarkdown(params: {
  comparisonName: string
  propertyName: string
  caseTitle: string
  vendors: EstimateVendorInput[]
  result: EstimateComparisonResult | null
}) {
  const { comparisonName, propertyName, caseTitle, vendors, result } = params
  const lines: string[] = []

  lines.push(`# ${comparisonName}`)
  lines.push('')
  lines.push(`- 物件: ${propertyName || '未設定'}`)
  lines.push(`- 案件: ${caseTitle || '未設定'}`)
  lines.push('')

  lines.push('## 比較対象')
  lines.push('')

  vendors
    .filter((vendor) => vendor.enabled)
    .forEach((vendor) => {
      lines.push(`### ${vendor.vendorName || '業者名未設定'}`)
      if (vendor.headline) lines.push(`- 見出し: ${vendor.headline}`)
      if (vendor.priceText) lines.push(`- 金額: ${vendor.priceText}`)
      if (vendor.notes) lines.push(`- 補足: ${vendor.notes}`)
      if (vendor.estimateText) {
        lines.push('')
        lines.push(vendor.estimateText)
      }
      lines.push('')
    })

  if (!result) {
    lines.push('## 比較結果')
    lines.push('')
    lines.push('まだ比較結果はありません。')
    return lines.join('\n')
  }

  lines.push('## 比較結果要約')
  lines.push('')
  lines.push(result.summary || '要約なし')
  lines.push('')
  lines.push('## 推奨業者')
  lines.push('')
  lines.push(result.recommendedVendor || '未判定')
  lines.push('')
  lines.push('## 推奨理由')
  lines.push('')
  lines.push(result.recommendedReason || '未生成')
  lines.push('')

  if (result.strengths.length > 0) {
    lines.push('## 強み')
    lines.push('')
    result.strengths.forEach((item) => lines.push(`- ${item}`))
    lines.push('')
  }

  if (result.cautions.length > 0) {
    lines.push('## 注意点')
    lines.push('')
    result.cautions.forEach((item) => lines.push(`- ${item}`))
    lines.push('')
  }

  if (result.questions.length > 0) {
    lines.push('## 確認質問')
    lines.push('')
    result.questions.forEach((item) => lines.push(`- ${item}`))
    lines.push('')
  }

  if (result.comparisonComment) {
    lines.push('## 比較コメント')
    lines.push('')
    lines.push(result.comparisonComment)
    lines.push('')
  }

  if (result.boardComment) {
    lines.push('## 理事会用コメント')
    lines.push('')
    lines.push(result.boardComment)
    lines.push('')
  }

  if (result.bossComment) {
    lines.push('## 上司報告')
    lines.push('')
    lines.push(result.bossComment)
    lines.push('')
  }

  if (result.vendorQuestionText) {
    lines.push('## 業者確認文')
    lines.push('')
    lines.push(result.vendorQuestionText)
    lines.push('')
  }

  if (result.recommendationMemo) {
    lines.push('## 推奨メモ')
    lines.push('')
    lines.push(result.recommendationMemo)
    lines.push('')
  }

  if (result.comparisonTable.length > 0) {
    lines.push('## 比較表')
    lines.push('')
    result.comparisonTable.forEach((row) => {
      lines.push(`- 項目: ${row.item}`)
      if (row.vendorA) lines.push(`  - 業者A: ${row.vendorA}`)
      if (row.vendorB) lines.push(`  - 業者B: ${row.vendorB}`)
      if (row.vendorC) lines.push(`  - 業者C: ${row.vendorC}`)
      if (row.comment) lines.push(`  - コメント: ${row.comment}`)
    })
    lines.push('')
  }

  return lines.join('\n')
}

function buildEstimateComparisonWordHtmlDocument(params: {
  comparisonName: string
  propertyName: string
  caseTitle: string
  vendors: EstimateVendorInput[]
  result: EstimateComparisonResult | null
}) {
  const markdown = buildEstimateComparisonMarkdown(params)
  const html = escapeHtml(markdown).replaceAll('\n', '<br />')

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(params.comparisonName)}</title>
</head>
<body style="font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; line-height: 1.8; color: #0f172a; padding: 24px;">
  <div style="font-size: 28px; font-weight: 700; margin-bottom: 16px;">
    ${escapeHtml(params.comparisonName)}
  </div>
  <div style="font-size: 14px;">
    ${html}
  </div>
</body>
</html>
  `.trim()
}

function OutputBlock({
  title,
  value,
  onCopy,
}: {
  title: string
  value: string
  onCopy: () => void
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-bold text-slate-900">{title}</div>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          コピー
        </button>
      </div>
      <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
        {value || 'まだ生成されていません。'}
      </div>
    </div>
  )
}

export default function EstimateComparisonCenterClient({
  propertyId,
  caseId,
  propertyName,
  caseTitle,
}: EstimateComparisonCenterClientProps) {
  const apiBasePath = `/api/properties/${propertyId}/cases/${caseId}`
  const [comparisonName, setComparisonName] = useState(
    `${caseTitle || '案件名未設定'} 見積比較`
  )
  const [vendors, setVendors] = useState<EstimateVendorInput[]>(
    createInitialVendors()
  )
  const [result, setResult] = useState<EstimateComparisonResult | null>(null)
  const [records, setRecords] = useState<EstimateComparisonRecord[]>([])
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [banner, setBanner] = useState<BannerState>(null)
  const [isComparing, setIsComparing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const activeVendors = useMemo(
    () =>
      vendors.filter(
        (vendor) =>
          vendor.enabled &&
          (vendor.vendorName.trim() !== '' || vendor.estimateText.trim() !== '')
      ),
    [vendors]
  )

  function showBanner(type: BannerType, text: string) {
    setBanner({ type, text })
  }

  function updateVendorField(
    vendorId: string,
    key: keyof EstimateVendorInput,
    value: string | boolean
  ) {
    setVendors((current) =>
      current.map((vendor) =>
        vendor.id === vendorId ? { ...vendor, [key]: value } : vendor
      )
    )
  }

  function resetToInitialState() {
    setComparisonName(`${caseTitle || '案件名未設定'} 見積比較`)
    setVendors(createInitialVendors())
    setResult(null)
    setSelectedRecordId(null)
    setBanner(null)
  }

  async function loadRecords() {
    setIsLoadingHistory(true)

    try {
      const response = await fetch(
        `${apiBasePath}/estimate-comparison-records`,
        {
          method: 'GET',
          cache: 'no-store',
        }
      )

      if (!response.ok) {
        throw new Error('保存履歴の取得に失敗しました。')
      }

      const rawJson: unknown = await response.json()

      let rawRecords: unknown[] = []

      if (Array.isArray(rawJson)) {
        rawRecords = rawJson
      } else if (isObject(rawJson) && Array.isArray(rawJson.records)) {
        rawRecords = rawJson.records
      } else if (isObject(rawJson) && Array.isArray(rawJson.data)) {
        rawRecords = rawJson.data
      }

      const normalized = rawRecords
        .map((record) => normalizeEstimateComparisonRecord(record))
        .filter(Boolean) as EstimateComparisonRecord[]

      setRecords(normalized)
    } catch (error) {
      console.error(error)
      showBanner('error', '保存履歴の読み込みに失敗しました。')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  useEffect(() => {
    void loadRecords()
  }, [apiBasePath])

  async function runComparison() {
    if (activeVendors.length < 2) {
      showBanner('error', '比較には2社以上の見積本文が必要です。')
      return
    }

    const hasEnoughText = activeVendors.every(
      (vendor) => vendor.estimateText.trim().length > 0
    )

    if (!hasEnoughText) {
      showBanner('error', '有効な業者には見積本文を入力してください。')
      return
    }

    setIsComparing(true)
    setBanner(null)

    try {
      const response = await fetch(`${apiBasePath}/estimate-ai-center`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comparisonName,
          propertyName,
          caseTitle,
          vendors: activeVendors.map((vendor) => ({
            vendorName: vendor.vendorName,
            headline: vendor.headline,
            estimateText: vendor.estimateText,
            priceText: vendor.priceText,
            notes: vendor.notes,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('AI見積比較の実行に失敗しました。')
      }

      const rawJson: unknown = await response.json()
      const normalized = normalizeEstimateComparisonResult(rawJson)

      if (!normalized) {
        throw new Error('比較結果の形式が不正です。')
      }

      setResult(normalized)
      showBanner('success', 'AI見積比較を実行しました。')
    } catch (error) {
      console.error(error)
      showBanner('error', 'AI見積比較の実行に失敗しました。')
    } finally {
      setIsComparing(false)
    }
  }

  async function saveRecord(status: 'draft' | 'final') {
    if (!result) {
      showBanner('error', '先に比較結果を生成してください。')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(
        `${apiBasePath}/estimate-comparison-records`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'save',
            recordId: selectedRecordId,
            title: comparisonName,
            status,
            vendors,
            result,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('保存に失敗しました。')
      }

      const rawJson: unknown = await response.json()
      const source =
        isObject(rawJson) && isObject(rawJson.record)
          ? rawJson.record
          : isObject(rawJson) && isObject(rawJson.data)
            ? rawJson.data
            : rawJson

      const savedRecord = normalizeEstimateComparisonRecord(source)

      if (savedRecord) {
        setSelectedRecordId(savedRecord.id)
      }

      showBanner(
        'success',
        status === 'final'
          ? '比較結果を確定保存しました。'
          : '比較結果を下書き保存しました。'
      )

      await loadRecords()
    } catch (error) {
      console.error(error)
      showBanner('error', '保存に失敗しました。')
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteRecord(recordId: string) {
    const ok = window.confirm('この保存履歴を削除します。よろしいですか？')
    if (!ok) return

    try {
      const response = await fetch(
        `${apiBasePath}/estimate-comparison-records`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'delete',
            recordId,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('削除に失敗しました。')
      }

      if (selectedRecordId === recordId) {
        setSelectedRecordId(null)
      }

      await loadRecords()
      showBanner('success', '保存履歴を削除しました。')
    } catch (error) {
      console.error(error)
      showBanner('error', '保存履歴の削除に失敗しました。')
    }
  }

  function openRecord(record: EstimateComparisonRecord) {
    setSelectedRecordId(record.id)
    setComparisonName(record.title)
    setVendors(normalizeVendorList(record.vendors))
    setResult(record.result)
    showBanner('info', '保存履歴を読み込みました。')
  }

  async function copyText(value: string, successText: string) {
    try {
      await navigator.clipboard.writeText(value)
      showBanner('success', successText)
    } catch (error) {
      console.error(error)
      showBanner('error', 'コピーに失敗しました。')
    }
  }

  function buildFullMarkdown() {
    return buildEstimateComparisonMarkdown({
      comparisonName,
      propertyName,
      caseTitle,
      vendors,
      result,
    })
  }

  function buildWordDocumentHtml() {
    return buildEstimateComparisonWordHtmlDocument({
      comparisonName,
      propertyName,
      caseTitle,
      vendors,
      result,
    })
  }

  function handleDownloadMarkdown() {
    downloadFile(
      `${comparisonName || 'estimate-comparison'}.md`,
      buildFullMarkdown(),
      'text/markdown;charset=utf-8'
    )
    showBanner('success', 'Markdownを保存しました。')
  }

  function handleDownloadWord() {
    downloadFile(
      `${comparisonName || 'estimate-comparison'}.doc`,
      buildWordDocumentHtml(),
      'application/msword;charset=utf-8'
    )
    showBanner('success', 'Word形式で保存しました。')
  }

  function handlePrint() {
    const printWindow = window.open('', '_blank', 'width=1200,height=900')

    if (!printWindow) {
      showBanner('error', '印刷画面を開けませんでした。')
      return
    }

    printWindow.document.open()
    printWindow.document.write(buildWordDocumentHtml())
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const fullMarkdown = buildFullMarkdown()

  return (
    <div className="p-6 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-sm font-semibold tracking-[0.18em] text-emerald-600">
                AI見積比較センター
              </div>
              <h1 className="mt-3 text-3xl font-bold text-slate-900">
                {comparisonName || '見積比較'}
              </h1>
              <div className="mt-3 space-y-1 text-sm text-slate-500">
                <div>物件: {propertyName || '未設定'}</div>
                <div>案件: {caseTitle || '未設定'}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  void copyText(fullMarkdown, '比較結果をコピーしました。')
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                全文コピー
              </button>
              <button
                type="button"
                onClick={handleDownloadMarkdown}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Markdown保存
              </button>
              <button
                type="button"
                onClick={handleDownloadWord}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Word保存
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                印刷
              </button>
            </div>
          </div>

          {banner ? (
            <div
              className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                banner.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : banner.type === 'error'
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-sky-200 bg-sky-50 text-sky-700'
              }`}
            >
              {banner.text}
            </div>
          ) : null}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <section className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-bold text-slate-900">比較設定</div>
              <p className="mt-1 text-sm text-slate-500">
                比較名と見積本文を整えてからAI比較へ進みます。
              </p>

              <div className="mt-4">
                <label className="text-sm font-semibold text-slate-700">
                  比較名
                </label>
                <input
                  value={comparisonName}
                  onChange={(event) => setComparisonName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300"
                  placeholder="例: エレベーター改修 見積比較"
                />
              </div>

              <div className="mt-6 grid gap-4">
                {vendors.map((vendor, index) => (
                  <div
                    key={vendor.id}
                    className={`rounded-2xl border p-4 ${
                      vendor.enabled
                        ? 'border-slate-200 bg-white'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          業者 {index + 1}
                        </div>
                        <p className="mt-1 text-xs leading-6 text-slate-500">
                          比較したい見積本文をそのまま貼り付けます。
                        </p>
                      </div>

                      <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={vendor.enabled}
                          onChange={(event) =>
                            updateVendorField(
                              vendor.id,
                              'enabled',
                              event.target.checked
                            )
                          }
                        />
                        比較対象に含める
                      </label>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-semibold text-slate-700">
                          業者名
                        </label>
                        <input
                          value={vendor.vendorName}
                          onChange={(event) =>
                            updateVendorField(
                              vendor.id,
                              'vendorName',
                              event.target.value
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300"
                          placeholder="例: ○○設備"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-700">
                          見出し
                        </label>
                        <input
                          value={vendor.headline}
                          onChange={(event) =>
                            updateVendorField(
                              vendor.id,
                              'headline',
                              event.target.value
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300"
                          placeholder="例: 排水管更新工事 見積書"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-700">
                          金額メモ
                        </label>
                        <input
                          value={vendor.priceText}
                          onChange={(event) =>
                            updateVendorField(
                              vendor.id,
                              'priceText',
                              event.target.value
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300"
                          placeholder="例: 1,250,000円"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-700">
                          補足メモ
                        </label>
                        <input
                          value={vendor.notes}
                          onChange={(event) =>
                            updateVendorField(
                              vendor.id,
                              'notes',
                              event.target.value
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300"
                          placeholder="例: 保証年数が長い"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="text-sm font-semibold text-slate-700">
                        見積本文
                      </label>
                      <textarea
                        value={vendor.estimateText}
                        onChange={(event) =>
                          updateVendorField(
                            vendor.id,
                            'estimateText',
                            event.target.value
                          )
                        }
                        rows={8}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-emerald-300"
                        placeholder="ここに見積本文を貼り付けてください"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void runComparison()}
                  disabled={isComparing}
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isComparing ? 'AI比較を実行中...' : 'AI見積比較を実行'}
                </button>

                <button
                  type="button"
                  onClick={() => void saveRecord('draft')}
                  disabled={isSaving || !result}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  下書き保存
                </button>

                <button
                  type="button"
                  onClick={() => void saveRecord('final')}
                  disabled={isSaving || !result}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  確定保存
                </button>

                <button
                  type="button"
                  onClick={resetToInitialState}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  入力を初期化
                </button>

                <button
                  type="button"
                  onClick={() => void loadRecords()}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  保存履歴を再読込
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-bold text-slate-900">比較結果</div>
              <p className="mt-1 text-sm text-slate-500">
                推奨業者、比較コメント、理事会向け文章までここで確認します。
              </p>

              {!result ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-500">
                  まだ比較結果はありません。見積本文を2社以上入れて「AI見積比較を実行」を押してください。
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="text-sm font-bold text-emerald-700">
                      推奨業者
                    </div>
                    <div className="mt-2 text-2xl font-bold text-emerald-900">
                      {result.recommendedVendor || '未判定'}
                    </div>
                    <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-emerald-800">
                      {result.recommendedReason || '推奨理由はまだありません。'}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="text-sm font-bold text-slate-900">要約</div>
                    <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                      {result.summary || '要約なし'}
                    </div>
                  </div>

                  {result.comparisonTable.length > 0 ? (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="min-w-full border-collapse text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                              項目
                            </th>
                            <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                              業者A
                            </th>
                            <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                              業者B
                            </th>
                            <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                              業者C
                            </th>
                            <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                              コメント
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.comparisonTable.map((row, index) => (
                            <tr key={`${row.item}-${index}`} className="bg-white">
                              <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                                {row.item}
                              </td>
                              <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
                                {row.vendorA}
                              </td>
                              <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
                                {row.vendorB}
                              </td>
                              <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
                                {row.vendorC}
                              </td>
                              <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
                                {row.comment}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}

                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="space-y-4">
                      <OutputBlock
                        title="比較コメント"
                        value={result.comparisonComment}
                        onCopy={() =>
                          void copyText(
                            result.comparisonComment,
                            '比較コメントをコピーしました。'
                          )
                        }
                      />
                      <OutputBlock
                        title="理事会用コメント"
                        value={result.boardComment}
                        onCopy={() =>
                          void copyText(
                            result.boardComment,
                            '理事会用コメントをコピーしました。'
                          )
                        }
                      />
                      <OutputBlock
                        title="上司報告"
                        value={result.bossComment}
                        onCopy={() =>
                          void copyText(
                            result.bossComment,
                            '上司報告をコピーしました。'
                          )
                        }
                      />
                    </div>

                    <div className="space-y-4">
                      <OutputBlock
                        title="業者確認文"
                        value={result.vendorQuestionText}
                        onCopy={() =>
                          void copyText(
                            result.vendorQuestionText,
                            '業者確認文をコピーしました。'
                          )
                        }
                      />
                      <OutputBlock
                        title="推奨メモ"
                        value={result.recommendationMemo}
                        onCopy={() =>
                          void copyText(
                            result.recommendationMemo,
                            '推奨メモをコピーしました。'
                          )
                        }
                      />

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="text-sm font-bold text-slate-900">
                          強み
                        </div>
                        <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
                          {result.strengths.length === 0 ? (
                            <li>まだありません。</li>
                          ) : (
                            result.strengths.map((item, index) => (
                              <li key={`${item}-${index}`}>・{item}</li>
                            ))
                          )}
                        </ul>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="text-sm font-bold text-slate-900">
                          注意点・確認質問
                        </div>
                        <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
                          {result.cautions.map((item, index) => (
                            <li key={`caution-${index}`}>・{item}</li>
                          ))}
                          {result.questions.map((item, index) => (
                            <li key={`question-${index}`}>・{item}</li>
                          ))}
                          {result.cautions.length === 0 &&
                          result.questions.length === 0 ? (
                            <li>まだありません。</li>
                          ) : null}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    保存済み比較履歴
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    過去の比較を開き直して、そのまま再編集できます。
                  </p>
                </div>

                <div className="text-sm font-semibold text-slate-500">
                  {isLoadingHistory ? '読込中...' : `${records.length}件`}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {records.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    保存済み履歴はまだありません。比較実行後に下書き保存または確定保存すると、ここへ並びます。
                  </div>
                ) : (
                  records.map((record) => (
                    <div
                      key={record.id}
                      className={`rounded-2xl border p-4 ${
                        selectedRecordId === record.id
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-bold text-slate-900">
                              {record.title}
                            </div>
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold ${getStatusBadgeClass(
                                record.status
                              )}`}
                            >
                              {record.status === 'final' ? '確定' : '下書き'}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-slate-500">
                            更新日時: {formatDateTime(record.updatedAt)}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openRecord(record)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            開く
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteRecord(record.id)}
                            className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-bold text-slate-900">使い方</div>
              <ol className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <li>1. 比較したい見積本文を2社以上貼り付ける</li>
                <li>2. AI見積比較を実行する</li>
                <li>3. 推奨業者・理事会コメント・確認文を確認する</li>
                <li>4. 下書き保存または確定保存する</li>
                <li>5. 必要なら全文コピー、Word保存、印刷を使う</li>
              </ol>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}