'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import EstimateComparisonResultSections, {
  type EstimateComparisonResultData,
} from './EstimateComparisonResultSections'
import {
  exportEstimateComparisonToExcel,
  exportEstimateComparisonToPdf,
} from '../../lib/estimateComparisonExport'

type VendorItem = {
  vendorName: string
  amountText: string
  editableText: string
}

export type SaveRecord = {
  id: string
  project_title: string
  base_estimate_text: string
  vendors: VendorItem[]
  selected_sections: string[]
  result: EstimateComparisonResultData
  created_at: string
  updated_at: string
}

type Props = {
  record: SaveRecord
}

function formatDate(value: string): string {
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

export default function EstimateComparisonSaveDetailClient({ record }: Props) {
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showBaseText, setShowBaseText] = useState(false)
  const [showVendorTexts, setShowVendorTexts] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [exportMessage, setExportMessage] = useState('')

  async function handleExportExcel() {
    setIsExportingExcel(true)
    setExportMessage('')
    try {
      await exportEstimateComparisonToExcel(
        record.result,
        record.selected_sections,
        record.project_title
      )
      setExportMessage('Excelをダウンロードしました')
    } catch {
      setExportMessage('Excel出力に失敗しました')
    } finally {
      setIsExportingExcel(false)
    }
  }

  async function handleExportPdf() {
    setIsExportingPdf(true)
    setExportMessage('PDFを作成中...')
    try {
      await exportEstimateComparisonToPdf(
        record.result,
        record.selected_sections,
        record.project_title
      )
      setExportMessage('PDFをダウンロードしました')
    } catch {
      setExportMessage('PDF出力に失敗しました')
    } finally {
      setIsExportingPdf(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/estimate-comparison/records/${record.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data: unknown = await res.json()
        const msg =
          typeof data === 'object' && data !== null && 'error' in data
            ? String((data as Record<string, unknown>).error)
            : '削除に失敗しました。'
        setDeleteError(msg)
        return
      }
      router.push('/estimate-comparison/history')
    } catch {
      setDeleteError('通信エラーが発生しました。')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-6 lg:p-10">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* ヘッダー */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4">
            <Link
              href="/estimate-comparison/history"
              className="text-sm font-semibold text-slate-500 hover:text-slate-800"
            >
              ← 履歴一覧に戻る
            </Link>
          </div>
          <div className="text-sm font-semibold tracking-[0.18em] text-emerald-600">
            見積比較表 保存済み
          </div>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">{record.project_title}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
            <span>作成日時：{formatDate(record.created_at)}</span>
            <span>業者数：{record.vendors.length}社</span>
          </div>

          {/* アクションボタン */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={`/estimate-comparison?from=${record.id}`}
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              再編集する
            </Link>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExportingExcel ? 'Excel作成中...' : 'Excelで出力'}
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExportingPdf ? 'PDF作成中...' : 'PDFで出力'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirm(true)
                setDeleteError(null)
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              削除する
            </button>
          </div>
          {exportMessage && (
            <div className="mt-3 text-sm text-slate-600">{exportMessage}</div>
          )}

          {deleteError && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3">
              <p className="text-sm text-rose-700">{deleteError}</p>
            </div>
          )}
        </section>

        {/* 基準見積・各社見積テキスト（折りたたみ） */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-slate-700">入力テキスト（保存時の内容）</div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowBaseText((v) => !v)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                基準見積 {showBaseText ? '▲ 閉じる' : '▼ 表示'}
              </button>
              <button
                type="button"
                onClick={() => setShowVendorTexts((v) => !v)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                各社見積 {showVendorTexts ? '▲ 閉じる' : '▼ 表示'}
              </button>
            </div>
          </div>

          {showBaseText && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-xs font-bold text-emerald-700">基準見積テキスト</div>
              <pre className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-700">
                {record.base_estimate_text || '（なし）'}
              </pre>
            </div>
          )}

          {showVendorTexts && (
            <div className="mt-4 space-y-3">
              {record.vendors.map((v, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-bold text-slate-700">
                    業者 {i + 1}：{v.vendorName}
                    {v.amountText && (
                      <span className="ml-2 font-normal text-slate-500">（{v.amountText}）</span>
                    )}
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-700">
                    {v.editableText || '（なし）'}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 比較結果 */}
        <EstimateComparisonResultSections
          result={record.result}
          appliedSections={record.selected_sections}
        />

      </div>

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">この見積比較表を削除しますか？</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              削除すると元に戻せません。保存済みの比較表・コメント・議案文がすべて削除されます。
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                {isDeleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
