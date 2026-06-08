'use client'

import { useState, useTransition } from 'react'

export type HandoverSections = {
  物件概要: string
  財務情報: string
  重要注意事項: string
  理事長対応: string
  管理メモ: string
  進行中案件: string
  未完了タスク: string
  クレーム継続事項: string
  申し送り: string
}

type Props = {
  propertyId: string
  initialSections: HandoverSections
  updatedAt?: string | null
}

type SectionConfig = {
  key: keyof HandoverSections
  label: string
  source: 'db' | 'ai' | 'manual'
  rows: number
  required?: boolean
}

const SECTIONS: SectionConfig[] = [
  { key: '物件概要',      label: '物件概要',        source: 'db',     rows: 5 },
  { key: '財務情報',      label: '財務情報',        source: 'db',     rows: 4 },
  { key: '重要注意事項',  label: '重要注意事項',    source: 'db',     rows: 5 },
  { key: '理事長対応',    label: '理事長対応メモ',  source: 'db',     rows: 4 },
  { key: '管理メモ',      label: '管理・理事会メモ', source: 'db',    rows: 4 },
  { key: '進行中案件',    label: '進行中の案件',    source: 'ai',     rows: 8 },
  { key: '未完了タスク',  label: '未完了タスク',    source: 'ai',     rows: 8 },
  { key: 'クレーム継続事項', label: 'クレーム・継続事項', source: 'ai', rows: 6 },
  { key: '申し送り',      label: '次担当者への申し送り', source: 'manual', rows: 6, required: true },
]

const SOURCE_BADGE: Record<string, string> = {
  db:     'bg-slate-100 text-slate-500',
  ai:     'bg-blue-50 text-blue-600',
  manual: 'bg-amber-50 text-amber-700',
}
const SOURCE_LABEL: Record<string, string> = {
  db:     'DBから自動入力',
  ai:     'AIが生成',
  manual: '手入力',
}

function sectionsToDocument(sections: HandoverSections): string {
  return SECTIONS
    .map(({ key, label }) => `【${label}】\n${sections[key] || '（記入なし）'}`)
    .join('\n\n')
}

export default function HandoverEditor({ propertyId, initialSections, updatedAt }: Props) {
  const [sections, setSections] = useState<HandoverSections>(initialSections)
  const [aiGenerated, setAiGenerated] = useState(false)
  const [isGenerating, startGenerate] = useTransition()
  const [isSaving, startSave] = useTransition()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function updateSection(key: keyof HandoverSections, value: string) {
    setSections((prev) => ({ ...prev, [key]: value }))
  }

  function handleGenerate() {
    setError('')
    setMessage('')
    startGenerate(async () => {
      const res = await fetch(`/api/properties/${propertyId}/handover-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'AI生成に失敗しました。')
        return
      }
      setSections((prev) => ({
        ...prev,
        進行中案件: data['進行中案件'] || prev.進行中案件,
        未完了タスク: data['未完了タスク'] || prev.未完了タスク,
        クレーム継続事項: data['クレーム継続事項'] || prev.クレーム継続事項,
      }))
      setAiGenerated(true)
      setMessage('AI生成が完了しました。内容を確認・編集してから保存してください。')
    })
  }

  function handleSave() {
    setError('')
    setMessage('')
    startSave(async () => {
      const res = await fetch(`/api/properties/${propertyId}/handover-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '引き継ぎ書', content: sectionsToDocument(sections) }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '保存に失敗しました。')
        return
      }
      setMessage('保存しました。')
    })
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー操作バー */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">引き継ぎ書を作成する</p>
            <p className="mt-0.5 text-xs text-slate-500">
              物件情報・カルテは自動入力済みです。「生成する」ボタンで案件・タスク・クレームセクションをAIが補完します。
              {updatedAt && <span className="ml-2">最終保存: {new Date(updatedAt).toLocaleDateString('ja-JP')}</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isGenerating ? 'AI生成中...' : '引き継ぎ書を生成する'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isSaving ? '保存中...' : '保存する'}
            </button>
          </div>
        </div>

        {message && (
          <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">{message}</div>
        )}
        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
        )}
      </div>

      {/* セクション一覧 */}
      {SECTIONS.map(({ key, label, source, rows, required }) => (
        <div key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">{label}</span>
            {required && <span className="text-xs text-amber-600">※必須</span>}
            <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${SOURCE_BADGE[source]}`}>
              {source === 'ai' && aiGenerated ? 'AI生成済み' : SOURCE_LABEL[source]}
            </span>
          </div>
          <textarea
            value={sections[key]}
            onChange={(e) => updateSection(key, e.target.value)}
            rows={rows}
            placeholder={source === 'manual' ? '次担当者への申し送り事項を記入してください' : source === 'ai' ? '「引き継ぎ書を生成する」ボタンで自動入力されます' : ''}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
          />
        </div>
      ))}

      {/* 下部保存ボタン */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isSaving ? '保存中...' : '保存する'}
        </button>
      </div>
    </div>
  )
}
