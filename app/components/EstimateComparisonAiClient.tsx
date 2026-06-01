'use client'

import { useRef, useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

type SelectedSection =
  | 'comparisonTable'
  | 'vendorSummaries'
  | 'priceDifference'
  | 'missingItems'
  | 'questionsToVendors'
  | 'boardComment'
  | 'agendaDraft'

const ALL_SECTIONS: SelectedSection[] = [
  'comparisonTable',
  'vendorSummaries',
  'priceDifference',
  'missingItems',
  'questionsToVendors',
  'boardComment',
  'agendaDraft',
]

const SECTION_LABELS: Record<SelectedSection, string> = {
  comparisonTable: '比較表',
  vendorSummaries: '各社の特徴',
  priceDifference: '金額差・注意点',
  missingItems: '不足している項目',
  questionsToVendors: '業者へ確認すべき質問',
  boardComment: '理事会向けコメント',
  agendaDraft: '総会議案文',
}

type VendorInput = {
  id: string
  vendorName: string
  amountText: string
  file: File | null
  rawText: string
}

type EditableVendor = {
  vendorName: string
  amountText: string
  editableText: string
  warning?: string
}

type ComparisonRow = {
  item: string
  values: { vendorName: string; value: string }[]
  note?: string
}

type VendorSummary = {
  vendorName: string
  totalAmount: string
  strengths: string[]
  concerns: string[]
}

type ComparisonResult = {
  overview: string
  comparisonRows: ComparisonRow[]
  vendorSummaries: VendorSummary[]
  cheapestVendor?: string
  priceDifferenceSummary: string
  missingItems: string[]
  questionsToVendors: string[]
  boardComment: string
  agendaDraft: string
}

type AppStep = 'input' | 'review' | 'result'

// ─── Helpers ─────────────────────────────────────────────────────────────────

let counter = 0
function createVendor(): VendorInput {
  counter += 1
  return { id: `v-${counter}`, vendorName: '', amountText: '', file: null, rawText: '' }
}

function buildTableCopyText(result: ComparisonResult, vendorCols: string[]): string {
  const header = ['比較項目', ...vendorCols, '備考'].join('\t')
  const rows = result.comparisonRows.map((row) => {
    const cells = vendorCols.map((name) => {
      const found = row.values.find((v) => v.vendorName === name)
      return found?.value ?? '見積書上では確認できません'
    })
    return [row.item, ...cells, row.note ?? ''].join('\t')
  })
  return [header, ...rows].join('\n')
}

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: AppStep }) {
  const steps: { key: AppStep; label: string }[] = [
    { key: 'input', label: '見積を読み込む' },
    { key: 'review', label: '読み取り結果を確認・修正' },
    { key: 'result', label: '比較表を作成' },
  ]
  const idx = steps.findIndex((s) => s.key === current)
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const done = i < idx
        const active = i === idx
        return (
          <div key={s.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? 'bg-emerald-600 text-white'
                    : active
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {done ? '✓' : i + 1}
              </div>
              <span
                className={`text-xs font-semibold whitespace-nowrap ${
                  active ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mb-4 h-px w-12 shrink-0 ${done ? 'bg-emerald-400' : 'bg-slate-200'}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── File Input ──────────────────────────────────────────────────────────────

function FileInput({
  id,
  value,
  onChange,
  label,
}: {
  id: string
  value: File | null
  onChange: (f: File | null) => void
  label: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div>
      <input
        ref={ref}
        id={id}
        type="file"
        accept=".xlsx,.xls,.csv,.pdf"
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <label
        htmlFor={id}
        className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm transition hover:border-emerald-400 hover:bg-emerald-50"
      >
        <span className="text-base leading-none text-slate-400">📎</span>
        {value ? (
          <span className="font-semibold text-emerald-700">{value.name}</span>
        ) : (
          <span className="text-slate-500">{label}</span>
        )}
      </label>
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange(null)
            if (ref.current) ref.current.value = ''
          }}
          className="mt-1 text-xs text-slate-400 hover:text-rose-600"
        >
          ファイルを削除
        </button>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EstimateComparisonAiClient() {
  // Step
  const [step, setStep] = useState<AppStep>('input')

  // Step 1: input state
  const [projectTitle, setProjectTitle] = useState('')
  const [selectedSections, setSelectedSections] = useState<SelectedSection[]>([...ALL_SECTIONS])
  const [baseFile, setBaseFile] = useState<File | null>(null)
  const [baseInputText, setBaseInputText] = useState('')
  const [vendors, setVendors] = useState<VendorInput[]>([createVendor(), createVendor()])

  // Step 2: review state
  const [editableBaseText, setEditableBaseText] = useState('')
  const [editableBaseWarning, setEditableBaseWarning] = useState<string | null>(null)
  const [editableVendors, setEditableVendors] = useState<EditableVendor[]>([])
  const [extractWarnings, setExtractWarnings] = useState<string[]>([])

  // Step 3: result state
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [appliedSections, setAppliedSections] = useState<SelectedSection[]>([])

  // UI
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // ── Vendor input handlers ──

  function addVendor() {
    if (vendors.length >= 4) return
    setVendors((prev) => [...prev, createVendor()])
  }

  function removeVendor(id: string) {
    if (vendors.length <= 1) return
    setVendors((prev) => prev.filter((v) => v.id !== id))
  }

  function updateVendor(id: string, field: keyof Omit<VendorInput, 'id' | 'file'>, value: string) {
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)))
  }

  function setVendorFile(id: string, file: File | null) {
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, file } : v)))
  }

  function toggleSection(id: SelectedSection) {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  async function copyText(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000)
    } catch {
      // clipboard API unavailable
    }
  }

  // ── Step 1 → Step 2: extract ──

  async function handleExtract() {
    setError(null)

    if (!baseFile && !baseInputText.trim()) {
      setError('基準見積のファイルまたはテキストを入力してください。')
      return
    }
    if (vendors.length < 1) {
      setError('比較対象の業者を1社以上追加してください。')
      return
    }
    if (vendors.some((v) => !v.vendorName.trim())) {
      setError('全ての業者の名称を入力してください。')
      return
    }
    if (vendors.some((v) => !v.file && !v.rawText.trim())) {
      setError('全ての業者の見積ファイルまたは見積内容テキストを入力してください。')
      return
    }
    if (selectedSections.length === 0) {
      setError('作成する内容を1つ以上選択してください。')
      return
    }

    setIsLoading(true)
    setLoadingMessage('見積内容を読み取り中...')
    try {
      const fd = new FormData()
      const metadata = {
        baseEstimateText: baseInputText.trim(),
        vendors: vendors.map((v) => ({
          vendorName: v.vendorName.trim(),
          amountText: v.amountText.trim() || undefined,
          rawText: v.rawText.trim(),
        })),
      }
      fd.append('metadata', JSON.stringify(metadata))
      if (baseFile) fd.append('baseFile', baseFile)
      vendors.forEach((v, i) => {
        if (v.file) fd.append(`vendor_${i}_file`, v.file)
      })

      const res = await fetch('/api/estimate-comparison/extract', {
        method: 'POST',
        body: fd,
      })
      const data: unknown = await res.json()

      if (!res.ok) {
        const msg =
          typeof data === 'object' && data !== null && 'error' in data
            ? String((data as Record<string, unknown>).error)
            : '読み取りに失敗しました。'
        setError(msg)
        return
      }

      type ExtractResponse = {
        baseEstimateText: string
        vendorTexts: { vendorName: string; extractedText: string }[]
        warnings: string[]
      }
      const resp = data as ExtractResponse
      const allWarnings = Array.isArray(resp.warnings) ? resp.warnings : []

      // Base warning: if file was provided but extracted text is empty
      if (baseFile && !resp.baseEstimateText.trim()) {
        setEditableBaseWarning(
          allWarnings.find((w) => w.startsWith('基準見積：')) ??
            'PDFからテキストを読み取れませんでした。テキスト貼り付けをご利用ください。'
        )
      } else {
        setEditableBaseWarning(null)
      }

      setEditableBaseText(resp.baseEstimateText)
      setEditableVendors(
        (resp.vendorTexts ?? []).map((vt) => {
          const original = vendors.find((v) => v.vendorName.trim() === vt.vendorName)
          const warning = allWarnings.find((w) => w.startsWith(`${vt.vendorName}：`))
          return {
            vendorName: vt.vendorName,
            amountText: original?.amountText.trim() ?? '',
            editableText: vt.extractedText,
            warning,
          }
        })
      )
      setExtractWarnings(allWarnings)
      setStep('review')
    } catch {
      setError('通信エラーが発生しました。再度お試しください。')
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }

  // ── Step 2 → Step 3: compare ──

  async function handleCompare() {
    setError(null)

    if (!editableBaseText.trim()) {
      setError('基準見積の内容を入力してください。')
      return
    }
    if (editableVendors.some((v) => !v.editableText.trim())) {
      setError('全ての業者の見積内容を入力してください。')
      return
    }
    if (selectedSections.length === 0) {
      setError('作成する内容を1つ以上選択してください。')
      return
    }

    setIsLoading(true)
    setLoadingMessage('AIが比較表を作成中...')
    try {
      const res = await fetch('/api/estimate-comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: projectTitle.trim() || '工事見積比較',
          baseEstimateText: editableBaseText.trim(),
          selectedSections,
          estimates: editableVendors.map((v) => ({
            vendorName: v.vendorName,
            amountText: v.amountText || undefined,
            rawText: v.editableText.trim(),
          })),
        }),
      })

      const data: unknown = await res.json()

      if (!res.ok) {
        const msg =
          typeof data === 'object' && data !== null && 'error' in data
            ? String((data as Record<string, unknown>).error)
            : 'AI比較の実行に失敗しました。'
        setError(msg)
        return
      }

      if (
        typeof data === 'object' &&
        data !== null &&
        'result' in data &&
        typeof (data as Record<string, unknown>).result === 'object'
      ) {
        setResult((data as { result: ComparisonResult }).result)
        setAppliedSections([...selectedSections])
        setStep('result')
      }
    } catch {
      setError('通信エラーが発生しました。再度お試しください。')
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }

  function resetToInput() {
    setStep('input')
    setResult(null)
    setError(null)
    setEditableBaseText('')
    setEditableVendors([])
    setExtractWarnings([])
  }

  // ── Computed ──

  const vendorCols = result
    ? (() => {
        const fromRows = [
          ...new Set(
            result.comparisonRows
              .flatMap((row) => row.values.map((v) => v.vendorName))
              .filter(Boolean)
          ),
        ]
        if (fromRows.length > 0) return fromRows
        if (result.vendorSummaries.length > 0)
          return ['基準見積', ...result.vendorSummaries.map((vs) => vs.vendorName)]
        return ['基準見積', ...vendors.map((v) => v.vendorName).filter(Boolean)]
      })()
    : []

  const has = (s: SelectedSection) => appliedSections.includes(s)

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="p-6 lg:p-10">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* ヘッダー */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold tracking-[0.18em] text-emerald-600">AIツール</div>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">見積比較表AI</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            基準見積を軸に複数業者の見積を比較し、理事会・総会向けの比較表とコメントを作成します。
            Excel・PDF・CSVのアップロード、またはテキスト貼り付けに対応しています。
          </p>
          <div className="mt-6">
            <StepIndicator current={step} />
          </div>
        </section>

        {/* ─── Step 1: 入力フォーム ─── */}
        {step === 'input' && (
          <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">見積内容を入力</h2>

            {/* 工事項目名 */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-slate-700">
                工事項目名
                <span className="ml-2 text-xs font-normal text-slate-400">
                  （例：外壁塗装工事・エレベーター保守等）
                </span>
              </label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="例：外壁塗装工事"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {/* 基準見積 */}
            <div className="mt-8">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="text-sm font-bold text-emerald-800">基準見積</div>
                <p className="mt-1 text-xs leading-5 text-emerald-700">
                  この見積を基準に、各社見積の項目・仕様・数量・金額を比較します。
                </p>
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-600">
                      ファイルアップロード
                      <span className="ml-2 font-normal text-slate-400">Excel / PDF / CSV</span>
                    </div>
                    <div className="mt-1.5">
                      <FileInput
                        id="base-file"
                        value={baseFile}
                        onChange={setBaseFile}
                        label="基準見積ファイルを選択（.xlsx / .xls / .csv / .pdf）"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600">
                      テキスト貼り付け
                      <span className="ml-2 font-normal text-slate-400">
                        ファイルがない場合、またはファイルと併用
                      </span>
                    </label>
                    <textarea
                      value={baseInputText}
                      onChange={(e) => setBaseInputText(e.target.value)}
                      placeholder={`基準見積の内容をここに貼り付けてください。\n工事項目、仕様、数量、単価、金額、保証条件等が含まれると比較精度が上がります。`}
                      rows={5}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 各社見積 */}
            <div className="mt-8">
              <div className="text-sm font-bold text-slate-700">比較対象の業者見積</div>
              <p className="mt-1 text-xs text-slate-500">
                基準見積と比較したい業者の見積を入力してください。
              </p>
              <div className="mt-4 space-y-5">
                {vendors.map((vendor, index) => (
                  <div
                    key={vendor.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-700">業者 {index + 1}</div>
                      {vendors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVendor(vendor.id)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
                        >
                          削除
                        </button>
                      )}
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600">
                          業者名<span className="ml-1 text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={vendor.vendorName}
                          onChange={(e) => updateVendor(vendor.id, 'vendorName', e.target.value)}
                          placeholder="例：〇〇建設株式会社"
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600">
                          見積金額
                          <span className="ml-2 text-xs font-normal text-slate-400">（任意）</span>
                        </label>
                        <input
                          type="text"
                          value={vendor.amountText}
                          onChange={(e) => updateVendor(vendor.id, 'amountText', e.target.value)}
                          placeholder="例：2,500,000円（税抜）"
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-xs font-semibold text-slate-600">
                        ファイルアップロード
                        <span className="ml-2 font-normal text-slate-400">Excel / PDF / CSV</span>
                      </div>
                      <div className="mt-1.5">
                        <FileInput
                          id={`vendor-file-${vendor.id}`}
                          value={vendor.file}
                          onChange={(f) => setVendorFile(vendor.id, f)}
                          label="見積ファイルを選択（.xlsx / .xls / .csv / .pdf）"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-slate-600">
                        見積内容テキスト貼り付け
                        <span className="ml-2 font-normal text-slate-400">
                          ファイルがない場合、またはファイルと併用
                        </span>
                      </label>
                      <textarea
                        value={vendor.rawText}
                        onChange={(e) => updateVendor(vendor.id, 'rawText', e.target.value)}
                        placeholder={`見積書の内容をここに貼り付けてください。`}
                        rows={4}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {vendors.length < 4 && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={addVendor}
                    className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700"
                  >
                    <span className="text-base leading-none">＋</span>
                    業者を追加（{vendors.length}/4社）
                  </button>
                </div>
              )}
            </div>

            {/* 作成する内容を選択 */}
            <div className="mt-8 border-t border-slate-100 pt-7">
              <div className="text-sm font-bold text-slate-700">作成する内容を選択</div>
              <p className="mt-1 text-xs text-slate-500">
                初期状態では全項目が選択されています。不要な項目はチェックを外してください。
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {ALL_SECTIONS.map((sectionId) => {
                  const checked = selectedSections.includes(sectionId)
                  return (
                    <label
                      key={sectionId}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-3 transition ${
                        checked
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-slate-200 bg-slate-50 hover:border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSection(sectionId)}
                        className="h-4 w-4 shrink-0 rounded border-slate-300 accent-emerald-600"
                      />
                      <span
                        className={`text-xs font-semibold ${
                          checked ? 'text-emerald-800' : 'text-slate-700'
                        }`}
                      >
                        {SECTION_LABELS[sectionId]}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
                <p className="text-sm font-semibold text-rose-700">{error}</p>
              </div>
            )}

            <div className="mt-6">
              <button
                type="button"
                onClick={handleExtract}
                disabled={isLoading}
                className="inline-flex min-w-[220px] items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {loadingMessage}
                  </>
                ) : (
                  '見積内容を読み取る'
                )}
              </button>
            </div>
          </section>
        )}

        {/* ─── Step 2: 読み取り結果の確認・修正 ─── */}
        {step === 'review' && (
          <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-900">読み取り結果を確認・修正</h2>
              <button
                type="button"
                onClick={resetToInput}
                className="text-sm font-semibold text-slate-500 hover:text-slate-800"
              >
                ← 入力に戻る
              </button>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              ファイルから読み取った内容を確認し、必要に応じて修正してください。
              修正後のテキストをもとにAIが比較表を作成します。
            </p>

            {/* 警告表示 */}
            {extractWarnings.length > 0 && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                <div className="text-xs font-bold text-amber-700">読み取り時の注意</div>
                <ul className="mt-2 space-y-1">
                  {extractWarnings.map((w, i) => (
                    <li key={i} className="text-xs leading-5 text-amber-800">
                      ・{w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 基準見積 編集 */}
            <div className="mt-6">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="text-sm font-bold text-emerald-800">基準見積（編集可）</div>
                <p className="mt-1 text-xs text-emerald-700">
                  この内容を比較の軸として使用します。必要に応じて修正してください。
                </p>
                {editableBaseWarning && (
                  <div className="mt-2 rounded-xl border border-amber-200 bg-white px-4 py-2.5">
                    <p className="text-xs text-amber-700">{editableBaseWarning}</p>
                  </div>
                )}
                <textarea
                  value={editableBaseText}
                  onChange={(e) => setEditableBaseText(e.target.value)}
                  rows={8}
                  placeholder="基準見積の内容を入力または修正してください。"
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            {/* 各社見積 編集 */}
            <div className="mt-6 space-y-5">
              {editableVendors.map((ev, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-sm font-bold text-slate-700">
                    業者 {i + 1}：{ev.vendorName}
                    {ev.amountText && (
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        金額メモ：{ev.amountText}
                      </span>
                    )}
                  </div>
                  {ev.warning && (
                    <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
                      <p className="text-xs text-amber-700">{ev.warning}</p>
                    </div>
                  )}
                  <textarea
                    value={ev.editableText}
                    onChange={(e) =>
                      setEditableVendors((prev) =>
                        prev.map((v, j) => (j === i ? { ...v, editableText: e.target.value } : v))
                      )
                    }
                    rows={7}
                    placeholder="見積内容を入力または修正してください。"
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              ))}
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
                <p className="text-sm font-semibold text-rose-700">{error}</p>
              </div>
            )}

            <div className="mt-6">
              <button
                type="button"
                onClick={handleCompare}
                disabled={isLoading}
                className="inline-flex min-w-[260px] items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {loadingMessage}
                  </>
                ) : (
                  '修正内容をもとに比較表を作成する'
                )}
              </button>
            </div>
          </section>
        )}

        {/* ─── Step 3: AI出力結果 ─── */}
        {step === 'result' && result && (
          <div className="space-y-5">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={resetToInput}
                className="text-sm font-semibold text-slate-500 hover:text-slate-800"
              >
                ← 最初からやり直す
              </button>
            </div>

            {/* 1. 総評（常に表示） */}
            <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">01</div>
              <h2 className="mt-2 text-xl font-bold text-slate-900">総評</h2>
              <p className="mt-4 text-sm leading-7 text-slate-700">{result.overview}</p>
            </section>

            {/* 2. 比較表 */}
            {has('comparisonTable') && result.comparisonRows.length > 0 && (
              <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">02</div>
                    <h2 className="mt-2 text-xl font-bold text-slate-900">比較表</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      基準見積を軸に各社の内容を比較しています
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(buildTableCopyText(result, vendorCols), 'table')}
                    className="shrink-0 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    {copiedId === 'table' ? 'コピーしました' : '比較表をコピー'}
                  </button>
                </div>
                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-3 pr-4 text-left text-xs font-bold text-slate-500 whitespace-nowrap">
                          比較項目
                        </th>
                        {vendorCols.map((name) => (
                          <th
                            key={name}
                            className={`px-4 py-3 text-left text-xs font-bold whitespace-nowrap ${
                              name === '基準見積'
                                ? 'text-emerald-700'
                                : 'text-slate-500'
                            }`}
                          >
                            {name}
                          </th>
                        ))}
                        <th className="pl-4 py-3 text-left text-xs font-bold text-slate-500 whitespace-nowrap">
                          備考
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.comparisonRows.map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 pr-4 text-sm font-semibold text-slate-700 whitespace-nowrap align-top">
                            {row.item}
                          </td>
                          {vendorCols.map((name) => {
                            const found = row.values.find((v) => v.vendorName === name)
                            const val = found?.value ?? '見積書上では確認できません'
                            return (
                              <td
                                key={name}
                                className={`px-4 py-3 text-sm leading-6 align-top ${
                                  name === '基準見積'
                                    ? 'bg-emerald-50 text-slate-700'
                                    : val === '項目なし'
                                    ? 'text-rose-600'
                                    : 'text-slate-700'
                                }`}
                              >
                                {val}
                              </td>
                            )
                          })}
                          <td className="pl-4 py-3 text-xs leading-6 text-slate-500 align-top">
                            {row.note ?? ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* 3. 各社の特徴 */}
            {has('vendorSummaries') && result.vendorSummaries.length > 0 && (
              <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">03</div>
                <h2 className="mt-2 text-xl font-bold text-slate-900">各社の特徴</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {result.vendorSummaries.map((vs) => (
                    <div
                      key={vs.vendorName}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="text-base font-bold text-slate-900">{vs.vendorName}</div>
                      <div className="mt-2 text-sm font-semibold text-slate-600">
                        見積総額：{vs.totalAmount}
                      </div>
                      {vs.strengths.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-bold text-emerald-700">基準見積との比較・特長</div>
                          <ul className="mt-1 space-y-1">
                            {vs.strengths.map((s, i) => (
                              <li key={i} className="text-sm leading-6 text-slate-700">・{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {vs.concerns.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-bold text-amber-700">基準見積との差異・懸念点</div>
                          <ul className="mt-1 space-y-1">
                            {vs.concerns.map((c, i) => (
                              <li key={i} className="text-sm leading-6 text-slate-700">・{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. 金額差・注意点 */}
            {has('priceDifference') && result.priceDifferenceSummary && (
              <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">04</div>
                <h2 className="mt-2 text-xl font-bold text-slate-900">金額差・注意点</h2>
                {result.cheapestVendor && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5">
                    <span className="text-xs font-semibold text-amber-700">最安値</span>
                    <span className="text-sm font-bold text-amber-900">{result.cheapestVendor}</span>
                    <span className="text-xs text-amber-700">※ 金額のみの判断は禁物です</span>
                  </div>
                )}
                <p className="mt-4 text-sm leading-7 text-slate-700">
                  {result.priceDifferenceSummary}
                </p>
              </section>
            )}

            {/* 5. 不足している項目 */}
            {has('missingItems') && result.missingItems.length > 0 && (
              <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">05</div>
                <h2 className="mt-2 text-xl font-bold text-slate-900">不足している項目</h2>
                <ul className="mt-4 space-y-2">
                  {result.missingItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                      <span className="mt-0.5 shrink-0 text-rose-500">▲</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 6. 業者へ確認すべき質問 */}
            {has('questionsToVendors') && result.questionsToVendors.length > 0 && (
              <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">06</div>
                <h2 className="mt-2 text-xl font-bold text-slate-900">業者へ確認すべき質問</h2>
                <ul className="mt-4 space-y-2">
                  {result.questionsToVendors.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                      <span className="mt-0.5 shrink-0 font-bold text-sky-600">Q{i + 1}</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 7. 理事会向けコメント */}
            {has('boardComment') && result.boardComment && (
              <section className="rounded-[28px] border border-emerald-100 bg-white p-8 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold tracking-[0.18em] text-emerald-600">07</div>
                    <h2 className="mt-2 text-xl font-bold text-slate-900">理事会向けコメント</h2>
                    <p className="mt-1 text-xs text-slate-500">資料にそのまま貼り付けて使えます</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(result.boardComment, 'board')}
                    className="shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    {copiedId === 'board' ? 'コピーしました' : '理事会コメントをコピー'}
                  </button>
                </div>
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
                    {result.boardComment}
                  </p>
                </div>
              </section>
            )}

            {/* 8. 総会議案文 */}
            {has('agendaDraft') && result.agendaDraft && (
              <section className="rounded-[28px] border border-violet-100 bg-white p-8 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold tracking-[0.18em] text-violet-600">08</div>
                    <h2 className="mt-2 text-xl font-bold text-slate-900">総会議案文</h2>
                    <p className="mt-1 text-xs text-slate-500">総会議案書の説明文として使えます</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(result.agendaDraft, 'agenda')}
                    className="shrink-0 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                  >
                    {copiedId === 'agenda' ? 'コピーしました' : '総会議案文をコピー'}
                  </button>
                </div>
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
                    {result.agendaDraft}
                  </p>
                </div>
              </section>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
