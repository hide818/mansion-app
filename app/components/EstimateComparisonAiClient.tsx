'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import EstimateComparisonResultSections, {
  type EstimateComparisonResultData,
} from './EstimateComparisonResultSections'
import {
  exportEstimateComparisonToExcel,
  exportEstimateComparisonToPdf,
} from '../../lib/estimateComparisonExport'

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

type AppStep = 'input' | 'review' | 'result'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export type InitialData = {
  projectTitle: string
  baseEstimateText: string
  vendors: { vendorName: string; amountText: string; editableText: string }[]
  selectedSections: string[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let counter = 0
function createVendor(): VendorInput {
  counter += 1
  return { id: `v-${counter}`, vendorName: '', amountText: '', file: null, rawText: '' }
}

function filterSections(sections: string[]): SelectedSection[] {
  return sections.filter((s): s is SelectedSection =>
    ALL_SECTIONS.includes(s as SelectedSection)
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

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
                {done ? (
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                ) : i + 1}
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
        <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
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

export default function EstimateComparisonAiClient({ initialData }: { initialData?: InitialData }) {
  // Step
  const [step, setStep] = useState<AppStep>(initialData ? 'review' : 'input')

  // Step 1: input state
  const [projectTitle, setProjectTitle] = useState(initialData?.projectTitle ?? '')
  const [selectedSections, setSelectedSections] = useState<SelectedSection[]>(
    initialData?.selectedSections
      ? filterSections(initialData.selectedSections)
      : [...ALL_SECTIONS]
  )
  const [baseFile, setBaseFile] = useState<File | null>(null)
  const [baseInputText, setBaseInputText] = useState('')
  const [vendors, setVendors] = useState<VendorInput[]>(
    initialData?.vendors?.length
      ? initialData.vendors.map((v, i) => ({
          id: `v-init-${i}`,
          vendorName: v.vendorName,
          amountText: v.amountText || '',
          file: null,
          rawText: '',
        }))
      : [createVendor(), createVendor()]
  )

  // Step 2: review state
  const [editableBaseText, setEditableBaseText] = useState(initialData?.baseEstimateText ?? '')
  const [editableBaseWarning, setEditableBaseWarning] = useState<string | null>(null)
  const [editableVendors, setEditableVendors] = useState<EditableVendor[]>(
    initialData?.vendors?.length
      ? initialData.vendors.map((v) => ({
          vendorName: v.vendorName,
          amountText: v.amountText || '',
          editableText: v.editableText || '',
        }))
      : []
  )
  const [extractWarnings, setExtractWarnings] = useState<string[]>([])

  // Step 3: result state
  const [result, setResult] = useState<EstimateComparisonResultData | null>(null)
  const [appliedSections, setAppliedSections] = useState<SelectedSection[]>([])

  // Save state
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [savedId, setSavedId] = useState<string | null>(null)

  // Export state
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [exportMessage, setExportMessage] = useState('')

  // UI
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

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
        setResult((data as { result: EstimateComparisonResultData }).result)
        setAppliedSections([...selectedSections])
        setSaveState('idle')
        setSavedId(null)
        setStep('result')
      }
    } catch {
      setError('通信エラーが発生しました。再度お試しください。')
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }

  // ── Save ──

  async function handleSave() {
    if (!result) return
    setSaveState('saving')
    try {
      const res = await fetch('/api/estimate-comparison/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: projectTitle.trim() || '工事見積比較',
          baseEstimateText: editableBaseText.trim(),
          vendors: editableVendors.map((v) => ({
            vendorName: v.vendorName,
            amountText: v.amountText,
            editableText: v.editableText,
          })),
          selectedSections: appliedSections,
          result,
        }),
      })
      const data: unknown = await res.json()
      if (!res.ok) {
        setSaveState('error')
        return
      }
      const savedRecord = (data as { record: { id: string } }).record
      setSavedId(savedRecord.id)
      setSaveState('saved')
    } catch {
      setSaveState('error')
    }
  }

  async function handleExportExcel() {
    if (!result) return
    setIsExportingExcel(true)
    setExportMessage('')
    try {
      await exportEstimateComparisonToExcel(
        result,
        appliedSections,
        projectTitle.trim() || '工事見積比較'
      )
      setExportMessage('Excelをダウンロードしました')
    } catch {
      setExportMessage('Excel出力に失敗しました')
    } finally {
      setIsExportingExcel(false)
    }
  }

  async function handleExportPdf() {
    if (!result) return
    setIsExportingPdf(true)
    setExportMessage('PDFを作成中...')
    try {
      await exportEstimateComparisonToPdf(
        result,
        appliedSections,
        projectTitle.trim() || '工事見積比較'
      )
      setExportMessage('PDFをダウンロードしました')
    } catch {
      setExportMessage('PDF出力に失敗しました')
    } finally {
      setIsExportingPdf(false)
    }
  }

  function resetToInput() {
    setStep('input')
    setResult(null)
    setError(null)
    setEditableBaseText('')
    setEditableBaseWarning(null)
    setEditableVendors([])
    setExtractWarnings([])
    setSaveState('idle')
    setSavedId(null)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="p-6 lg:p-10">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* ヘッダー */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold tracking-[0.18em] text-emerald-600">AIツール</div>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">見積比較表AI</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            基準見積を軸に複数業者の見積を比較し、理事会・総会向けの比較表とコメントを作成します。
          </p>
          <div className="mt-6">
            <StepIndicator current={step} />
          </div>
        </section>

        {/* ─── Step 1: 入力フォーム ─── */}
        {step === 'input' && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
                        placeholder="見積書の内容をここに貼り付けてください。"
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
                初期状態では全項目が選択されています。
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
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
              読み取った内容を確認し、必要に応じて修正してください。修正後の内容でAIが比較表を作成します。
            </p>

            {extractWarnings.length > 0 && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                <div className="text-xs font-bold text-amber-700">読み取り時の注意</div>
                <ul className="mt-2 space-y-1">
                  {extractWarnings.map((w, i) => (
                    <li key={i} className="text-xs leading-5 text-amber-800">・{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 基準見積 編集 */}
            <div className="mt-6">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="text-sm font-bold text-emerald-800">基準見積（編集可）</div>
                <p className="mt-1 text-xs text-emerald-700">
                  この内容を比較の軸として使用します。
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
                        prev.map((v, j) =>
                          j === i ? { ...v, editableText: e.target.value } : v
                        )
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

            {/* アクションバー */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-6 py-4 shadow-sm">
              <button
                type="button"
                onClick={resetToInput}
                className="text-sm font-semibold text-slate-500 hover:text-slate-800"
              >
                ← 最初からやり直す
              </button>

              <div className="flex flex-wrap items-center gap-3">
                {saveState === 'idle' && (
                  <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    保存する
                  </button>
                )}
                {saveState === 'saving' && (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-400 px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    <span className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    保存中...
                  </button>
                )}
                {saveState === 'saved' && savedId && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-emerald-700">保存しました</span>
                    <Link
                      href={`/estimate-comparison/history/${savedId}`}
                      className="text-sm font-semibold text-slate-600 underline hover:text-slate-900"
                    >
                      保存した結果を確認
                    </Link>
                    <Link
                      href="/estimate-comparison/history"
                      className="text-sm font-semibold text-slate-600 underline hover:text-slate-900"
                    >
                      履歴一覧
                    </Link>
                  </div>
                )}
                {saveState === 'error' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-rose-600">保存に失敗しました</span>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="text-sm font-semibold text-slate-600 underline"
                    >
                      再試行
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* エクスポートバー */}
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-6 py-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">出力：</span>
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={isExportingExcel}
                className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isExportingExcel ? 'Excel作成中...' : 'Excelで出力'}
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isExportingPdf ? 'PDF作成中...' : 'PDFで出力'}
              </button>
              {exportMessage && (
                <span className="text-xs text-slate-600">{exportMessage}</span>
              )}
            </div>

            {/* 比較結果セクション */}
            <EstimateComparisonResultSections
              result={result}
              appliedSections={appliedSections}
            />

          </div>
        )}

      </div>
    </div>
  )
}
