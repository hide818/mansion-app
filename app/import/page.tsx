'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

type Tab = 'properties' | 'residents' | 'inspections'
type ImportResult = { inserted: number; skipped: number; errors: string[] } | null

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'properties', label: '物件', icon: '🏢' },
  { key: 'residents', label: '居住者', icon: '👤' },
  { key: 'inspections', label: '法定点検', icon: '📋' },
]

const TEMPLATES: Record<Tab, { headers: string[]; sample: string[][] }> = {
  properties: {
    headers: ['物件名', '住所', '戸数'],
    sample: [
      ['○○マンション', '東京都新宿区西新宿1-1-1', '50'],
      ['△△レジデンス', '東京都渋谷区渋谷2-2-2', '30'],
    ],
  },
  residents: {
    headers: ['物件名', '部屋番号', '氏名', 'フリガナ', '電話番号', 'メール', '種別', '理事会', '役職'],
    sample: [
      ['○○マンション', '101', '山田 太郎', 'ヤマダ タロウ', '090-1234-5678', 'yamada@example.com', '区分所有者', '', ''],
      ['○○マンション', '201', '佐藤 花子', 'サトウ ハナコ', '080-9876-5432', 'sato@example.com', '区分所有者', 'yes', '理事長'],
      ['○○マンション', '301', '鈴木 一郎', 'スズキ イチロウ', '070-1111-2222', '', '賃借人', '', ''],
    ],
  },
  inspections: {
    headers: ['物件名', '点検名称', '点検種別', '次回期限', '前回実施日', '頻度(月)', '備考'],
    sample: [
      ['○○マンション', 'エレベーター定期検査（1号機）', 'エレベーター', '2026-09-30', '2025-09-30', '12', ''],
      ['○○マンション', '消防設備点検（春）', '消防設備', '2026-06-30', '2025-12-31', '6', ''],
      ['○○マンション', '貯水槽清掃', '貯水槽', '2026-08-31', '2025-08-31', '12', '年1回実施'],
    ],
  },
}

function toCSV(headers: string[], rows: string[][]) {
  return [headers, ...rows].map(r => r.join(',')).join('\n')
}

function downloadCSV(filename: string, content: string) {
  const bom = '﻿'
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ImportPage() {
  const [tab, setTab] = useState<Tab>('properties')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDownloadTemplate() {
    const t = TEMPLATES[tab]
    downloadCSV(`kura_${tab}_template.csv`, toCSV(t.headers, t.sample))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null)
    setResult(null)
  }

  async function handleImport() {
    if (!file) return
    setLoading(true)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/import/${tab}`, { method: 'POST', body: fd })
      const data = await res.json()
      setResult(data)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } finally {
      setLoading(false)
    }
  }

  const tmpl = TEMPLATES[tab]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">CSVインポート</h1>
            <p className="text-sm text-slate-500">ExcelデータをKuraに一括移行</p>
          </div>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">← ダッシュボードへ</Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl p-4 sm:p-6 space-y-5">

        {/* タブ */}
        <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden">
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setFile(null); setResult(null) }}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold transition ${tab === t.key ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* Step 1: テンプレート */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Step 1</p>
              <p className="mt-1 font-semibold text-slate-800">テンプレートをダウンロード</p>
              <p className="mt-0.5 text-xs text-slate-500">Excelで開いて、このフォーマットに沿ってデータを入力してください</p>
            </div>
            <button onClick={handleDownloadTemplate}
              className="shrink-0 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600">
              ダウンロード
            </button>
          </div>

          {/* フォーマットプレビュー */}
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-100 bg-slate-50">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200">
                  {tmpl.headers.map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tmpl.sample.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 text-slate-600 whitespace-nowrap">{cell || <span className="text-slate-300">（空欄OK）</span>}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Step 2: アップロード */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Step 2</p>
          <p className="mt-1 font-semibold text-slate-800">CSVファイルをアップロード</p>
          <p className="mt-0.5 text-xs text-slate-500">ExcelでCSV形式（UTF-8）で保存したファイルを選択してください</p>

          <div className="mt-4">
            <label className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition ${file ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50'}`}>
              <input ref={inputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
              {file ? (
                <>
                  <p className="text-2xl">✅</p>
                  <p className="mt-2 font-semibold text-blue-700">{file.name}</p>
                  <p className="text-xs text-blue-500">{(file.size / 1024).toFixed(1)} KB</p>
                </>
              ) : (
                <>
                  <p className="text-3xl text-slate-300">📂</p>
                  <p className="mt-2 text-sm font-medium text-slate-500">タップしてCSVを選択</p>
                  <p className="text-xs text-slate-400">.csv ファイルのみ対応</p>
                </>
              )}
            </label>
          </div>

          <button onClick={handleImport} disabled={!file || loading}
            className="mt-4 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500 active:scale-[0.98] disabled:opacity-40">
            {loading ? 'インポート中...' : 'インポート実行'}
          </button>
        </div>

        {/* 結果 */}
        {result && (
          <div className={`rounded-xl border p-5 ${result.errors.length === 0 ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
            <p className={`font-bold ${result.errors.length === 0 ? 'text-green-800' : 'text-orange-800'}`}>
              {result.errors.length === 0 ? '✅ インポート完了' : '⚠️ 一部エラーあり'}
            </p>
            <div className="mt-2 flex gap-4 text-sm">
              <span className="text-green-700">成功: <strong>{result.inserted}件</strong></span>
              <span className="text-slate-500">スキップ: {result.skipped}件</span>
            </div>
            {result.errors.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-semibold text-orange-700">エラー詳細：</p>
                {result.errors.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-xs text-orange-600">• {e}</p>
                ))}
                {result.errors.length > 5 && (
                  <p className="text-xs text-orange-500">他 {result.errors.length - 5} 件...</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 注意事項 */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold text-amber-700">注意事項</p>
          <ul className="mt-1.5 space-y-1 text-xs text-amber-600">
            <li>• ExcelでCSV保存する際は「CSV UTF-8（コンマ区切り）」を選択してください</li>
            <li>• 居住者のインポートは先に物件のインポートを完了させてください</li>
            <li>• 同じデータを2回インポートすると重複して登録されます</li>
          </ul>
        </div>

      </div>
    </div>
  )
}
