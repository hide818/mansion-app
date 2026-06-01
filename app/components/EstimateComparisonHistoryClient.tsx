'use client'

import { useState } from 'react'
import Link from 'next/link'

type VendorItem = {
  vendorName: string
}

type RecordSummary = {
  id: string
  project_title: string
  vendors: VendorItem[]
  selected_sections: string[]
  created_at: string
  updated_at: string
}

type Props = {
  initialRecords: RecordSummary[]
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

export default function EstimateComparisonHistoryClient({ initialRecords }: Props) {
  const [records, setRecords] = useState<RecordSummary[]>(initialRecords)
  const [searchText, setSearchText] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const filtered = searchText.trim()
    ? records.filter((r) =>
        r.project_title.toLowerCase().includes(searchText.trim().toLowerCase())
      )
    : records

  async function handleDelete(id: string) {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/estimate-comparison/records/${id}`, {
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
      setRecords((prev) => prev.filter((r) => r.id !== id))
      setConfirmDeleteId(null)
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-semibold tracking-[0.18em] text-emerald-600">AIツール</div>
              <h1 className="mt-3 text-3xl font-bold text-slate-900">見積比較表 履歴</h1>
              <p className="mt-3 text-base leading-7 text-slate-600">
                保存した見積比較表を確認・再編集できます。
              </p>
            </div>
            <Link
              href="/estimate-comparison"
              className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              ＋ 新しい比較を作成
            </Link>
          </div>
        </section>

        {/* 検索・一覧 */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">

          {/* 検索 */}
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="工事項目名で絞り込み..."
              className="w-full max-w-sm rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
            <span className="shrink-0 text-sm text-slate-500">{filtered.length}件</span>
          </div>

          {deleteError && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3">
              <p className="text-sm font-semibold text-rose-700">{deleteError}</p>
            </div>
          )}

          {/* テーブル */}
          {filtered.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-200 py-12 text-center">
              <p className="text-sm text-slate-500">
                {searchText ? '該当する履歴がありません。' : '保存された見積比較表はまだありません。'}
              </p>
              {!searchText && (
                <div className="mt-4">
                  <Link
                    href="/estimate-comparison"
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    見積比較を作成する
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 pr-6 text-left text-xs font-bold text-slate-500 whitespace-nowrap">
                      作成日時
                    </th>
                    <th className="py-3 pr-6 text-left text-xs font-bold text-slate-500">
                      工事項目名
                    </th>
                    <th className="py-3 pr-6 text-left text-xs font-bold text-slate-500 whitespace-nowrap">
                      業者数
                    </th>
                    <th className="py-3 text-left text-xs font-bold text-slate-500 whitespace-nowrap">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((record) => (
                    <tr key={record.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-4 pr-6 text-xs text-slate-500 whitespace-nowrap align-top">
                        {formatDate(record.created_at)}
                      </td>
                      <td className="py-4 pr-6 align-top">
                        <div className="font-semibold text-slate-900">{record.project_title}</div>
                      </td>
                      <td className="py-4 pr-6 text-sm text-slate-700 whitespace-nowrap align-top">
                        {Array.isArray(record.vendors) ? record.vendors.length : 0}社
                      </td>
                      <td className="py-4 align-top">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/estimate-comparison/history/${record.id}`}
                            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            開く
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDeleteId(record.id)
                              setDeleteError(null)
                            }}
                            className="inline-flex items-center justify-center rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>

      {/* 削除確認ダイアログ */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">この見積比較表を削除しますか？</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              削除すると元に戻せません。保存済みの比較表・コメント・議案文がすべて削除されます。
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                disabled={isDeleting}
                className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
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
