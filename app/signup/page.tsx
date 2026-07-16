'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import KuraLogo from '@/app/components/KuraLogo'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    companyName: '',
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('パスワードが一致しません'); return }
    if (form.password.length < 8) { setError('パスワードは8文字以上にしてください'); return }
    setLoading(true)
    try {
      setLoadingStep('アカウントを作成中...')
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          displayName: form.displayName,
          companyName: form.companyName,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '登録に失敗しました'); return }
      setLoadingStep('ログイン中...')
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
      if (signInError) { router.push('/login'); return }
      setLoadingStep('ダッシュボードへ移動中...')
      router.replace('/dashboard')
      router.refresh()
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[#0f2240]">

      {/* 背景 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2240] via-[#1e3a5f] to-[#0f2240]" />
        <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-500 opacity-10 blur-3xl" />
      </div>

      {/* 建物シルエット */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 200" className="w-full" preserveAspectRatio="xMidYMax slice">
          <rect x="0" y="100" width="45" height="100" fill="#1a3050" />
          <rect x="50" y="60" width="30" height="140" fill="#162840" />
          <rect x="85" y="80" width="50" height="120" fill="#1a3050" />
          <rect x="140" y="40" width="25" height="160" fill="#162840" />
          <rect x="170" y="70" width="60" height="130" fill="#1a3050" />
          <rect x="235" y="55" width="30" height="145" fill="#162840" />
          <rect x="270" y="85" width="45" height="115" fill="#1a3050" />
          <rect x="320" y="50" width="35" height="150" fill="#162840" />
          <rect x="358" y="90" width="32" height="110" fill="#1a3050" />
          <rect x="0" y="196" width="390" height="4" fill="#162840" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12">

        {/* ロゴ */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <KuraLogo size={56} variant="seal" />
            <span className="text-4xl font-extrabold tracking-tight text-white">Kura</span>
          </Link>
          <p className="mt-1 text-xs text-blue-400/70">新規アカウント登録</p>
        </div>

        {/* フォームカード */}
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-blue-200">会社名 <span className="text-red-400">*</span></label>
                <input type="text" name="companyName" value={form.companyName} onChange={handleChange} placeholder="〇〇マンション管理株式会社" required
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-blue-200">お名前</label>
                <input type="text" name="displayName" value={form.displayName} onChange={handleChange} placeholder="山田 太郎"
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-blue-200">メールアドレス <span className="text-red-400">*</span></label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="yamada@example.com" required autoComplete="email"
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-blue-200">パスワード（8文字以上） <span className="text-red-400">*</span></label>
                <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="8文字以上" required autoComplete="new-password"
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-blue-200">パスワード（確認） <span className="text-red-400">*</span></label>
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="もう一度入力" required autoComplete="new-password"
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30" />
              </div>

              {error && (
                <div className="rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-200">{error}</div>
              )}

              <button type="submit" disabled={loading}
                className="mt-1 w-full rounded-xl bg-blue-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400 active:scale-[0.98] disabled:opacity-50">
                {loading ? (loadingStep || '登録中...') : 'アカウントを作成する'}
              </button>
            </form>
          </div>

          <div className="mt-5 text-center space-y-2">
            <p className="text-sm text-blue-300">
              すでにアカウントをお持ちの方は{' '}
              <Link href="/login" className="font-bold text-white hover:underline">ログイン</Link>
            </p>
            <p className="text-xs text-blue-400/60">
              登録することで
              <Link href="/terms" className="hover:text-blue-300">利用規約</Link>・
              <Link href="/privacy" className="hover:text-blue-300">プライバシーポリシー</Link>
              に同意したものとみなします
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
