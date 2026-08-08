'use client'

import { useState } from 'react'

export default function TemplateDownloadForm() {
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/templates/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, company, templateId: 'sokai-gijiroku' }),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="text-center py-6">
        <div className="flex justify-center mb-4">
          <svg className="h-12 w-12 text-green-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="font-bold text-[#1d1d1f] text-lg">送信しました</p>
        <p className="text-sm text-[#6e6e73] mt-2">
          入力いただいたメールアドレスにテンプレートリンクをお送りしました。<br />
          届かない場合は迷惑メールフォルダをご確認ください。
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[#3d3d3d] mb-1">
          メールアドレス <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="yamada@example.com"
          className="w-full rounded-xl border border-[#d2d2d7] px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#3d3d3d] mb-1">
          会社名（任意）
        </label>
        <input
          type="text"
          value={company}
          onChange={e => setCompany(e.target.value)}
          placeholder="〇〇マンション管理株式会社"
          className="w-full rounded-xl border border-[#d2d2d7] px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>
      {status === 'error' && (
        <p className="text-sm text-red-600">エラーが発生しました。時間をおいて再度お試しください。</p>
      )}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded-xl bg-[#0071e3] py-3.5 text-sm font-bold text-white hover:bg-[#0077ed] transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? '送信中...' : '無料でテンプレートを受け取る →'}
      </button>
      <p className="text-center text-xs text-[#a1a1a6]">
        登録不要・無料・いつでも配信停止できます
      </p>
    </form>
  )
}
