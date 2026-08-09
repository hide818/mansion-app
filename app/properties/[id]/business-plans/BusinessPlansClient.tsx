'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'

type Category = { id: string; name: string }
type Plan = {
  id: string
  fiscal_year: number
  name: string
  budget_amount: number | null
  account_category_id: string | null
  account_category_text: string | null
  account_categories: { name: string } | null
  contractor: string | null
  scheduled_date: string | null
  status: '未着手' | '進行中' | '完了' | '延期'
  actual_amount: number | null
  notes: string | null
}

const STATUS_COLORS: Record<string, string> = {
  未着手: 'bg-slate-100 text-slate-600',
  進行中: 'bg-blue-100 text-blue-700',
  完了: 'bg-green-100 text-green-700',
  延期: 'bg-amber-100 text-amber-700',
}

function fmt(n: number | null) {
  if (n == null) return '―'
  return n.toLocaleString('ja-JP') + '円'
}

function fmtDate(s: string | null) {
  if (!s) return '―'
  const parts = s.slice(0, 10).split('-')
  if (parts.length === 3) return `${parts[0]}年${parts[1]}月${parts[2]}日`
  return s
}

function getCategoryLabel(plan: Plan): string {
  if (plan.account_category_text) return plan.account_category_text
  return plan.account_categories?.name ?? '―'
}

const currentYear = new Date().getFullYear()
const FISCAL_YEARS = Array.from({ length: 5 }, (_, i) => currentYear + 1 - i)

type FormState = {
  fiscal_year: number
  name: string
  budget_amount: string
  account_category_id: string
  account_category_text: string
  account_input_mode: 'select' | 'text'
  contractor: string
  scheduled_date: string
  status: Plan['status']
  actual_amount: string
  notes: string
}

const EMPTY_FORM: FormState = {
  fiscal_year: currentYear,
  name: '',
  budget_amount: '',
  account_category_id: '',
  account_category_text: '',
  account_input_mode: 'select',
  contractor: '',
  scheduled_date: '',
  status: '未着手',
  actual_amount: '',
  notes: '',
}

export default function BusinessPlansClient({
  propertyId,
  propertyName,
  initialPlans,
  categories,
}: {
  propertyId: string
  propertyName: string
  initialPlans: Plan[]
  categories: Category[]
}) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans)
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const filtered = plans.filter(p => p.fiscal_year === selectedYear)
  const totalBudget = filtered.reduce((s, p) => s + (p.budget_amount ?? 0), 0)
  const totalActual = filtered.reduce((s, p) => s + (p.actual_amount ?? 0), 0)
  const completedCount = filtered.filter(p => p.status === '完了').length

  function dateAlert(scheduled_date: string | null, status: string): 'overdue' | 'warning' | null {
    if (!scheduled_date || status === '完了') return null
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const d = new Date(scheduled_date); d.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((d.getTime() - today.getTime()) / 86400000)
    if (diffDays < 0) return 'overdue'
    if (diffDays <= 30) return 'warning'
    return null
  }

  const alertPlans = filtered.filter(p => dateAlert(p.scheduled_date, p.status) !== null)

  function openAdd() {
    setForm({ ...EMPTY_FORM, fiscal_year: selectedYear })
    setEditingPlan(null)
    setShowForm(true)
  }

  function openEdit(plan: Plan) {
    setForm({
      fiscal_year: plan.fiscal_year,
      name: plan.name,
      budget_amount: plan.budget_amount?.toString() ?? '',
      account_category_id: plan.account_category_id ?? '',
      account_category_text: plan.account_category_text ?? '',
      account_input_mode: plan.account_category_text ? 'text' : 'select',
      contractor: plan.contractor ?? '',
      scheduled_date: plan.scheduled_date?.slice(0, 10) ?? '',
      status: plan.status,
      actual_amount: plan.actual_amount?.toString() ?? '',
      notes: plan.notes ?? '',
    })
    setEditingPlan(plan)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('計画名は必須です'); return }
    setSaving(true)
    setError(null)

    const body = {
      property_id: propertyId,
      fiscal_year: form.fiscal_year,
      name: form.name.trim(),
      budget_amount: form.budget_amount ? parseInt(form.budget_amount) : null,
      account_category_id: form.account_input_mode === 'select' ? (form.account_category_id || null) : null,
      account_category_text: form.account_input_mode === 'text' ? (form.account_category_text.trim() || null) : null,
      contractor: form.contractor.trim() || null,
      scheduled_date: form.scheduled_date || null,
      status: form.status,
      actual_amount: form.actual_amount ? parseInt(form.actual_amount) : null,
      notes: form.notes.trim() || null,
    }

    const url = editingPlan ? `/api/business-plans/${editingPlan.id}` : '/api/business-plans'
    const method = editingPlan ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

    if (res.ok) {
      const saved = await res.json()
      if (editingPlan) {
        setPlans(prev => prev.map(p => p.id === saved.id ? saved : p))
      } else {
        setPlans(prev => [...prev, saved])
      }
      setShowForm(false)
      setEditingPlan(null)
    } else {
      const data = await res.json()
      setError(data.error ?? '保存に失敗しました')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('この事業計画を削除しますか？')) return
    const res = await fetch(`/api/business-plans/${id}`, { method: 'DELETE' })
    if (res.ok) setPlans(prev => prev.filter(p => p.id !== id))
  }

  function handlePrint() {
    window.print()
  }

  async function handleDownloadWord() {
    const {
      Document, Packer, Paragraph, Table, TableRow, TableCell,
      TextRun, AlignmentType, WidthType, ShadingType,
      BorderStyle, convertInchesToTwip, PageOrientation, TableLayoutType,
    } = await import('docx')

    const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })

    // 横向きA4（297mm）余白0.9in×2 → 使用幅 ≒ 14,220 twip
    const COL_WIDTHS = [4000, 1600, 1500, 1500, 1900, 1800, 1100] // 合計 13,400
    const HEADERS   = ['計画名', '勘定科目', '予算', '実績', '施工会社', '実施時期', '状況']

    const BORDER = { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' }
    const HEADER_FILL = '1E3A5F'
    const TOTAL_FILL  = 'EFF6FF'

    function run(text: string, opts: { bold?: boolean; color?: string; size?: number } = {}) {
      return new TextRun({
        text,
        bold: opts.bold ?? false,
        size: opts.size ?? 18,
        font: 'Meiryo',
        color: opts.color ?? '1E293B',
      })
    }

    function makeCell(
      paragraphs: InstanceType<typeof Paragraph>[],
      opts: { fill?: string; width?: number } = {}
    ) {
      return new TableCell({
        borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
        shading: opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill } : undefined,
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
        children: paragraphs,
      })
    }

    function textCell(
      text: string,
      colIdx: number,
      opts: { bold?: boolean; alignRight?: boolean; fill?: string; color?: string } = {}
    ) {
      const fill = opts.fill
      return makeCell([
        new Paragraph({
          alignment: opts.alignRight ? AlignmentType.RIGHT : AlignmentType.LEFT,
          children: [run(text, { bold: opts.bold, color: opts.color })],
        }),
      ], { fill, width: COL_WIDTHS[colIdx] })
    }

    // 計画名セル（備考は2行目に小さく）
    function nameCell(plan: typeof filtered[0], fill: string) {
      const children: InstanceType<typeof Paragraph>[] = [
        new Paragraph({ children: [run(plan.name)] }),
      ]
      if (plan.notes) {
        children.push(new Paragraph({
          children: [run(`（${plan.notes}）`, { size: 16, color: '64748B' })],
        }))
      }
      return makeCell(children, { fill, width: COL_WIDTHS[0] })
    }

    const headerRow = new TableRow({
      tableHeader: true,
      children: HEADERS.map((h, ci) =>
        textCell(h, ci, { bold: true, fill: HEADER_FILL, color: 'FFFFFF' })
      ),
    })

    const dataRows = filtered.map((plan, i) => {
      const fill = i % 2 === 1 ? 'F8FAFC' : 'FFFFFF'
      return new TableRow({
        children: [
          nameCell(plan, fill),
          textCell(getCategoryLabel(plan), 1, { fill }),
          textCell(fmt(plan.budget_amount), 2, { alignRight: true, fill }),
          textCell(fmt(plan.actual_amount), 3, { alignRight: true, fill }),
          textCell(plan.contractor ?? '―', 4, { fill }),
          textCell(fmtDate(plan.scheduled_date), 5, { fill }),
          textCell(plan.status, 6, { fill }),
        ],
      })
    })

    const totalRow = new TableRow({
      children: [
        textCell('合計', 0, { bold: true, fill: TOTAL_FILL }),
        textCell('', 1, { fill: TOTAL_FILL }),
        textCell(fmt(totalBudget || null), 2, { bold: true, alignRight: true, fill: TOTAL_FILL }),
        textCell(fmt(totalActual || null), 3, { bold: true, alignRight: true, fill: TOTAL_FILL }),
        textCell('', 4, { fill: TOTAL_FILL }),
        textCell('', 5, { fill: TOTAL_FILL }),
        textCell('', 6, { fill: TOTAL_FILL }),
      ],
    })

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
            margin: {
              top: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.9),
              right: convertInchesToTwip(0.9),
            },
          },
        },
        children: [
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: '事業計画進捗報告書', bold: true, size: 36, font: 'Meiryo', color: '1E3A5F' })],
          }),
          // サブ情報行
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({ text: `物件名：${propertyName}　　`, size: 20, font: 'Meiryo', color: '475569' }),
              new TextRun({ text: `対象年度：${selectedYear}年度　　`, size: 20, font: 'Meiryo', color: '475569' }),
              new TextRun({ text: `出力日：${today}`, size: 20, font: 'Meiryo', color: '475569' }),
            ],
          }),
          // 本体表
          new Table({
            layout: TableLayoutType.FIXED,
            columnWidths: COL_WIDTHS,
            rows: [headerRow, ...dataRows, totalRow],
          }),
          // 合計サマリー
          new Paragraph({
            spacing: { before: 180 },
            children: [
              new TextRun({ text: `予算合計：${fmt(totalBudget || null)}　　実績合計：${fmt(totalActual || null)}`, size: 18, font: 'Meiryo', color: '475569' }),
            ],
          }),
        ],
      }],
    })

    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `事業計画_${propertyName}_${selectedYear}年度.docx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <style>{`
        #business-plan-print { display: none; }
        @media print {
          html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
          body * { visibility: hidden !important; }
          #business-plan-print, #business-plan-print * { visibility: visible !important; }
          #business-plan-print {
            display: block !important;
            position: absolute;
            top: 0; left: 0;
            width: 100%;
            padding: 20px;
            background: #fff !important;
          }
        }
      `}</style>

      {/* 印刷専用レイアウト */}
      <div id="business-plan-print" style={{ fontFamily: 'sans-serif' }}>
        <h2 style={{ fontSize: '16px', marginBottom: '4px' }}>{propertyName}｜{selectedYear}年度 事業計画進捗報告</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['計画名', '勘定科目', '予算', '実績', '施工会社', '実施時期', '状況', '備考'].map(h => (
                <th key={h} style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(plan => (
              <tr key={plan.id}>
                <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px' }}>{plan.name}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px' }}>{getCategoryLabel(plan)}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px', textAlign: 'right' }}>{fmt(plan.budget_amount)}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px', textAlign: 'right' }}>{fmt(plan.actual_amount)}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px' }}>{plan.contractor ?? '―'}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px' }}>{fmtDate(plan.scheduled_date)}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px' }}>{plan.status}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px' }}>{plan.notes ?? ''}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
              <td colSpan={2} style={{ border: '1px solid #e2e8f0', padding: '6px 8px' }}>合計</td>
              <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px', textAlign: 'right' }}>{fmt(totalBudget || null)}</td>
              <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px', textAlign: 'right' }}>{fmt(totalActual || null)}</td>
              <td colSpan={4} style={{ border: '1px solid #e2e8f0', padding: '6px 8px' }} />
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6 no-print" ref={printRef}>
        {/* ヘッダー */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href={`/properties/${propertyId}`} className="text-xs text-blue-600 hover:underline">← {propertyName}</Link>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">事業計画進捗管理</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownloadWord} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Word出力
            </button>
            <button onClick={handlePrint} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              PDF出力
            </button>
            <button onClick={openAdd} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              ＋ 追加
            </button>
          </div>
        </div>

        {/* 年度切替 */}
        <div className="flex gap-2 flex-wrap">
          {FISCAL_YEARS.map(y => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${selectedYear === y ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {y}年度
            </button>
          ))}
        </div>

        {/* 期限アラートバナー */}
        {alertPlans.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 space-y-2">
            <p className="text-sm font-bold text-amber-800">⚠️ 実施時期が近い・過ぎている計画があります</p>
            {alertPlans.map(plan => {
              const kind = dateAlert(plan.scheduled_date, plan.status)
              return (
                <div key={plan.id} className={`flex items-center gap-3 rounded-xl px-4 py-2 text-sm ${kind === 'overdue' ? 'bg-red-50 border border-red-200' : 'bg-amber-100 border border-amber-200'}`}>
                  <span className={`font-semibold ${kind === 'overdue' ? 'text-red-700' : 'text-amber-700'}`}>
                    {kind === 'overdue' ? '期限切れ' : 'もうすぐ'}
                  </span>
                  <span className="text-slate-700">{plan.name}</span>
                  <span className="text-slate-500">実施時期: {fmtDate(plan.scheduled_date)}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* サマリー */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: '計画件数', value: `${filtered.length}件` },
            { label: '予算合計', value: fmt(totalBudget || null) },
            { label: `完了 / 実績`, value: `${completedCount}件 / ${fmt(totalActual || null)}` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {/* テーブル */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
            <p className="text-sm font-bold text-slate-700">{propertyName}｜{selectedYear}年度 事業計画</p>
          </div>
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">
              {selectedYear}年度の事業計画がまだありません。<br />「＋ 追加」から登録してください。
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                    <th className="px-4 py-3 text-left font-semibold">計画名</th>
                    <th className="px-4 py-3 text-left font-semibold">勘定科目</th>
                    <th className="px-4 py-3 text-right font-semibold">予算</th>
                    <th className="px-4 py-3 text-right font-semibold">実績</th>
                    <th className="px-4 py-3 text-left font-semibold">施工会社</th>
                    <th className="px-4 py-3 text-left font-semibold">実施時期</th>
                    <th className="px-4 py-3 text-left font-semibold">状況</th>
                    <th className="px-4 py-3 text-left font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(plan => {
                    const alert = dateAlert(plan.scheduled_date, plan.status)
                    const rowBg = alert === 'overdue'
                      ? 'bg-red-50 hover:bg-red-100'
                      : alert === 'warning'
                      ? 'bg-amber-50 hover:bg-amber-100'
                      : 'hover:bg-slate-50'
                    return (
                    <tr key={plan.id} className={`transition ${rowBg}`}>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {plan.name}
                        {plan.notes && <p className="mt-0.5 text-xs text-slate-400 font-normal">{plan.notes}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{getCategoryLabel(plan)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{fmt(plan.budget_amount)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{fmt(plan.actual_amount)}</td>
                      <td className="px-4 py-3 text-slate-600">{plan.contractor ?? '―'}</td>
                      <td className={`px-4 py-3 font-medium ${alert === 'overdue' ? 'text-red-700' : alert === 'warning' ? 'text-amber-700' : 'text-slate-600'}`}>
                        {fmtDate(plan.scheduled_date)}
                        {alert === 'overdue' && <span className="ml-1 text-xs font-semibold text-red-600">期限切れ</span>}
                        {alert === 'warning' && <span className="ml-1 text-xs font-semibold text-amber-600">もうすぐ</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[plan.status]}`}>
                          {plan.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button onClick={() => openEdit(plan)} className="text-xs text-blue-600 hover:underline">編集</button>
                          <button onClick={() => handleDelete(plan.id)} className="text-xs text-red-400 hover:underline">削除</button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                    <td colSpan={2} className="px-4 py-3 text-sm text-slate-700">合計</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-800">{fmt(totalBudget || null)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-800">{fmt(totalActual || null)}</td>
                    <td colSpan={4} className="px-4 py-3" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 追加・編集フォーム（モーダル） */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{editingPlan ? '事業計画を編集' : '事業計画を追加'}</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">年度</label>
                <select value={form.fiscal_year} onChange={e => setForm(f => ({ ...f, fiscal_year: parseInt(e.target.value) }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none">
                  {FISCAL_YEARS.map(y => <option key={y} value={y}>{y}年度</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">計画名 <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="例：外壁塗装工事、エレベーター点検"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">勘定科目</label>
                <div className="flex gap-3 mb-2">
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="radio" checked={form.account_input_mode === 'select'} onChange={() => setForm(f => ({ ...f, account_input_mode: 'select' }))} />
                    リストから選択
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="radio" checked={form.account_input_mode === 'text'} onChange={() => setForm(f => ({ ...f, account_input_mode: 'text' }))} />
                    直接入力
                  </label>
                </div>
                {form.account_input_mode === 'select' ? (
                  <select value={form.account_category_id} onChange={e => setForm(f => ({ ...f, account_category_id: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none">
                    <option value="">未分類</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) : (
                  <input type="text" value={form.account_category_text} onChange={e => setForm(f => ({ ...f, account_category_text: e.target.value }))}
                    placeholder="例：修繕費"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">実施時期</label>
                  <input type="date" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">状況</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Plan['status'] }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none">
                    {['未着手', '進行中', '完了', '延期'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">予算金額（円）</label>
                  <input type="number" value={form.budget_amount} onChange={e => setForm(f => ({ ...f, budget_amount: e.target.value }))}
                    placeholder="500000"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">実績金額（円）</label>
                  <input type="number" value={form.actual_amount} onChange={e => setForm(f => ({ ...f, actual_amount: e.target.value }))}
                    placeholder="480000"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">施工会社</label>
                <input type="text" value={form.contractor} onChange={e => setForm(f => ({ ...f, contractor: e.target.value }))}
                  placeholder="〇〇建設株式会社"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">備考</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="備考・メモ"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none resize-none" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => { setShowForm(false); setError(null) }} className="rounded-xl border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                キャンセル
              </button>
              <button onClick={handleSave} disabled={saving} className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
