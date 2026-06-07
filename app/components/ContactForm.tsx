'use client'

import { useState } from 'react'

type FormState = {
  company: string
  name: string
  email: string
  propertyCount: string
  message: string
}

export default function ContactForm() {
  const [form, setForm] = useState<FormState>({
    company: '', name: '', email: '', propertyCount: '', message: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus('done')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-10 text-center">
        <div className="flex justify-center mb-4">
          <svg className="h-12 w-12 text-green-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-lg font-bold text-green-800">お問い合わせを受け付けました</p>
        <p className="mt-2 text-sm text-green-600">3営業日以内にご連絡いたします。</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">会社名</label>
          <input
            name="company" value={form.company} onChange={handleChange}
            type="text" placeholder="〇〇マンション管理株式会社"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">お名前 <span className="text-red-500">*</span></label>
          <input
            name="name" value={form.name} onChange={handleChange}
            type="text" placeholder="山田 太郎" required
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">メールアドレス <span className="text-red-500">*</span></label>
        <input
          name="email" value={form.email} onChange={handleChange}
          type="email" placeholder="yamada@example.com" required
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">管理物件数（目安）</label>
        <select
          name="propertyCount" value={form.propertyCount} onChange={handleChange}
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">選択してください</option>
          <option>10棟未満</option>
          <option>10〜30棟</option>
          <option>30〜100棟</option>
          <option>100棟以上</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">ご質問・ご要望</label>
        <textarea
          name="message" value={form.message} onChange={handleChange}
          rows={4} placeholder="現在の課題や、気になることをご記入ください"
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
        />
      </div>
      {status === 'error' && (
        <p className="text-sm text-red-600">送信に失敗しました。時間をおいて再度お試しください。</p>
      )}
      <button
        type="submit" disabled={status === 'loading'}
        className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? '送信中...' : 'デモを申し込む'}
      </button>
      <p className="text-center text-xs text-slate-400">
        送信後、3営業日以内にご連絡いたします
      </p>
    </form>
  )
}
