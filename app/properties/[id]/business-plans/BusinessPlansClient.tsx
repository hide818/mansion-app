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
      TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle,
      ShadingType,
    } = await import('docx')

    const HEADERS = ['計画名', '勘定科目', '予算', '実績', '施工会社', '実施時期', '状況']
    const COL_WIDTHS = [2800, 1500, 1400, 1400, 1800, 1400, 1000]

    function cell(text: string, opts: { bold?: boolean; shading?: boolean; alignRight?: boolean } = {}) {
      return new TableCell({
        width: { size: 0, type: WidthType.AUTO },
        shading: opts.shading ? { type: ShadingType.CLEAR, fill: 'F1F5F9' } : undefined,
        children: [new Paragraph({
          alignment: opts.alignRight ? AlignmentType.RIGHT : AlignmentType.LEFT,
          children: [new TextRun({ text, bold: opts.bold ?? false, size: 20, font: 'Meiryo' })],
        })],
      })
    }

    const headerRow = new TableRow({
      children: HEADERS.map(h => cell(h, { bold: true, shading: true })),
    })

    const dataRows = filtered.map(plan => new TableRow({
      children: [
        cell(plan.name + (plan.notes ? `（${plan.notes}）` : '')),
        cell(getCategoryLabel(plan)),
        cell(fmt(plan.budget_amount), { alignRight: true }),
        cell(fmt(plan.actual_amount), { alignRight: true }),
        cell(plan.contractor ?? '―'),
        cell(fmtDate(plan.scheduled_date)),
        cell(plan.status),
      ],
    }))

    const totalRow = new TableRow({
      children: [
        cell('合計', { bold: true, shading: true }),
        cell('', { shading: true }),
        cell(fmt(totalBudget || null), { bold: true, shading: true, alignRight: true }),
        cell(fmt(totalActual || null), { bold: true, shading: true, alignRight: true }),
        cell('', { shading: true }),
        cell('', { shading: true }),
        cell('', { shading: true }),
      ],
    })

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: `${propertyName}｜${selectedYear}年度 事業計画進捗報告`, font: 'Meiryo', size: 28 })],
          }),
          new Paragraph({ children: [] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: COL_WIDTHS,
            rows: [headerRow, ...dataRows, totalRow],
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
        @media print {
          body > * { display: none !important; }
          #business-plan-print { display: block !important; }
          .no-print { display: none !important; }
        }
        #business-plan-print { display: none; }
        @media print {
          #business-plan-print { display: block; }
        }
      `}</style>

      {/* 印刷専用レイアウト */}
      <div id="business-plan-print" style={{ padding: '20px', fontFamily: 'sans-serif' }}>
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
                  {filtered.map(plan => (
                    <tr key={plan.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {plan.name}
                        {plan.notes && <p className="mt-0.5 text-xs text-slate-400 font-normal">{plan.notes}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{getCategoryLabel(plan)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{fmt(plan.budget_amount)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{fmt(plan.actual_amount)}</td>
                      <td className="px-4 py-3 text-slate-600">{plan.contractor ?? '―'}</td>
                      <td className="px-4 py-3 text-slate-600">{fmtDate(plan.scheduled_date)}</td>
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
                  ))}
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
