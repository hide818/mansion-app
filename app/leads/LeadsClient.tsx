'use client'

import { useState } from 'react'
import Link from 'next/link'

type Lead = {
  id: string
  company: string | null
  name: string
  email: string
  property_count: string | null
  message: string | null
  status: string
  notes: string | null
  created_at: string
}

const STATUS_OPTIONS = [
  { value: 'new', label: '新規', color: 'bg-blue-100 text-blue-700' },
  { value: 'contacted', label: '連絡済み', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'demo_scheduled', label: 'デモ予定', color: 'bg-purple-100 text-purple-700' },
  { value: 'converted', label: '成約', color: 'bg-green-100 text-green-700' },
  { value: 'lost', label: '失注', color: 'bg-slate-100 text-slate-500' },
]

function statusStyle(status: string) {
  return STATUS_OPTIONS.find(s => s.value === status)?.color ?? 'bg-slate-100 text-slate-500'
}
function statusLabel(status: string) {
  return STATUS_OPTIONS.find(s => s.value === status)?.label ?? status
}

export default function LeadsClient({ leads: initialLeads }: { leads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads)
  const [selected, setSelected] = useState<Lead | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [sendingSetup, setSendingSetup] = useState(false)
  const [setupSent, setSetupSent] = useState<string | null>(null)

  const counts = STATUS_OPTIONS.map(s => ({
    ...s,
    count: leads.filter(l => l.status === s.value).length,
  }))

  async function updateStatus(id: string, status: string) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
    await fetch('/api/leads/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
  }

  async function sendSetupEmail(lead: Lead) {
    setSendingSetup(true)
    await fetch('/api/leads/send-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lead.id, name: lead.name, email: lead.email, company: lead.company }),
    })
    await updateStatus(lead.id, 'converted')
    setSetupSent(lead.id)
    setSendingSetup(false)
  }

  async function saveNotes() {
    if (!selected) return
    setSaving(true)
    await fetch('/api/leads/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, notes }),
    })
    setLeads(prev => prev.map(l => l.id === selected.id ? { ...l, notes } : l))
    setSelected(prev => prev ? { ...prev, notes } : null)
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">見込み顧客リスト</h1>
            <p className="text-sm text-slate-500">LPからのお問い合わせ一覧</p>
          </div>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">← ダッシュボードへ</Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl p-4 sm:p-6 space-y-5">

        {/* サマリー */}
        <div className="grid grid-cols-5 gap-3">
          {counts.map(s => (
            <div key={s.value} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <p className="text-2xl font-extrabold text-slate-900">{s.count}</p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${s.color}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* リスト */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {leads.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <p className="text-sm">まだお問い合わせがありません</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500">
                  <th className="px-4 py-3 text-left">申し込み日</th>
                  <th className="px-4 py-3 text-left">会社名</th>
                  <th className="px-4 py-3 text-left">お名前</th>
                  <th className="px-4 py-3 text-left">物件数</th>
                  <th className="px-4 py-3 text-left">ステータス</th>
                  <th className="px-4 py-3 text-left">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{lead.company ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setSelected(lead); setNotes(lead.notes ?? '') }}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {lead.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{lead.property_count ?? '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.status}
                        onChange={e => updateStatus(lead.id, e.target.value)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border-0 cursor-pointer focus:outline-none ${statusStyle(lead.status)}`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`mailto:${lead.email}`}
                        className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-500 transition-colors"
                      >
                        メールする
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 詳細モーダル */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-slate-400">{new Date(selected.created_at).toLocaleDateString('ja-JP')}</p>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">{selected.name}</h2>
                <p className="text-sm text-slate-500">{selected.company ?? '会社名未入力'}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle(selected.status)}`}>
                {statusLabel(selected.status)}
              </span>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex gap-2">
                <span className="w-20 text-slate-400 shrink-0">メール</span>
                <a href={`mailto:${selected.email}`} className="text-blue-600 hover:underline">{selected.email}</a>
              </div>
              <div className="flex gap-2">
                <span className="w-20 text-slate-400 shrink-0">物件数</span>
                <span>{selected.property_count ?? '未選択'}</span>
              </div>
              {selected.message && (
                <div className="flex gap-2">
                  <span className="w-20 text-slate-400 shrink-0">ご質問</span>
                  <span className="text-slate-700 leading-relaxed">{selected.message}</span>
                </div>
              )}
            </div>

            {/* 設定完了メール送信 */}
            <div className="border-t border-slate-100 pt-4 mb-4">
              <p className="text-xs font-semibold text-slate-600 mb-2">アカウント設定完了メール</p>
              {setupSent === selected.id ? (
                <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 font-semibold">
                  送信済み — ステータスを「成約」に変更しました
                </div>
              ) : (
                <button
                  onClick={() => sendSetupEmail(selected)}
                  disabled={sendingSetup}
                  className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                >
                  {sendingSetup ? '送信中...' : '設定完了メールを送信してサインアップリンクを案内'}
                </button>
              )}
              <p className="mt-1.5 text-xs text-slate-400">送信後、相手に登録用リンクとアクセス方法が届きます</p>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1">社内メモ</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="連絡履歴・次のアクションなどを記録"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={saveNotes}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
