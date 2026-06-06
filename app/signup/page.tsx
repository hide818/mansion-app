'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

function BuildingBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 380" className="absolute bottom-0 w-full" style={{ opacity: 0.25 }} preserveAspectRatio="xMidYMax slice">
        <rect x="0" y="190" width="110" height="190" fill="#64748b" />
        <rect x="120" y="70" width="65" height="310" fill="#475569" />
        <rect x="195" y="130" width="120" height="250" fill="#64748b" />
        <rect x="325" y="45" width="55" height="335" fill="#4b5563" />
        <rect x="390" y="155" width="140" height="225" fill="#64748b" />
        <rect x="540" y="115" width="80" height="265" fill="#475569" />
        <rect x="630" y="60" width="70" height="320" fill="#4b5563" />
        <rect x="710" y="140" width="130" height="240" fill="#64748b" />
        <rect x="935" y="40" width="80" height="340" fill="#4b5563" />
        <rect x="1025" y="175" width="115" height="205" fill="#64748b" />
        <rect x="1150" y="90" width="60" height="290" fill="#475569" />
        <rect x="1220" y="150" width="220" height="230" fill="#64748b" />
        <rect x="0" y="376" width="1440" height="4" fill="#475569" />
      </svg>
    </div>
  )
}

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    if (form.password.length < 8) {
      setError('パスワードは8文字以上にしてください')
      return
    }

    setLoading(true)
    try {
      // サーバー側APIでユーザー作成
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

      if (!res.ok) {
        setError(data.error ?? '登録に失敗しました')
        return
      }

      // 作成成功 → ログイン
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (signInError) {
        setError('アカウントは作成されました。ログインページからログインしてください。')
        router.push('/login')
        return
      }

      router.replace('/dashboard')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200 px-4 py-8">
      <BuildingBackground />

      <div className="relative z-10 w-full max-w-sm">
        {/* ブランドヘッダー */}
        <div className="rounded-t-2xl bg-[#1e3a5f] px-6 py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-300">
            管理会社専用 AI
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white">Kura</h1>
          <p className="mt-1 text-xs text-blue-200">新規アカウント登録（管理者）</p>
        </div>

        {/* フォーム */}
        <div className="rounded-b-2xl border border-t-0 border-gray-200 bg-white px-6 py-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">会社名 <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                placeholder="〇〇マンション管理株式会社"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">お名前</label>
              <input
                type="text"
                name="displayName"
                value={form.displayName}
                onChange={handleChange}
                placeholder="山田 太郎"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">メールアドレス <span className="text-red-500">*</span></label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="yamada@example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">パスワード（8文字以上） <span className="text-red-500">*</span></label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="8文字以上"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">パスワード（確認） <span className="text-red-500">*</span></label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="同じパスワードを入力"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '登録中...' : 'アカウントを作成する'}
            </button>
          </form>

          <div className="mt-4 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-gray-500">
              すでにアカウントをお持ちの方は{' '}
              <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                ログイン
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          登録することで
          <a href="/terms" className="underline hover:text-gray-600">利用規約</a>
          および
          <a href="/privacy" className="underline hover:text-gray-600">プライバシーポリシー</a>
          に同意したものとみなします
        </p>
      </div>
    </div>
  )
}
