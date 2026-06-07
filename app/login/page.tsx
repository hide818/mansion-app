'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import KuraLogo from '@/app/components/KuraLogo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMessage('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setErrorMessage('メールアドレスまたはパスワードが違います')
        return
      }
      router.replace('/dashboard')
      router.refresh()
    } catch {
      setErrorMessage('通信エラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[#0f2240]">

      {/* 背景グラデーション */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2240] via-[#1e3a5f] to-[#0f2240]" />
        {/* 光の演出 */}
        <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-500 opacity-10 blur-3xl" />
        <div className="absolute bottom-20 right-0 h-48 w-48 rounded-full bg-blue-400 opacity-5 blur-3xl" />
      </div>

      {/* 建物シルエット（下部） */}
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

      {/* メインコンテンツ */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12">

        {/* ブランドロゴ */}
        <div className="mb-10 text-center">
          <KuraLogo size={64} variant="seal" />
          <h1 className="text-5xl font-extrabold tracking-tight text-white">Kura</h1>
          <p className="mt-2 text-sm font-medium text-blue-300">管理会社専用 AI</p>
          <p className="mt-1 text-xs text-blue-400/70">担当者が辞めても止まらない管理会社へ</p>
        </div>

        {/* ログインカード */}
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
            <h2 className="mb-5 text-center text-sm font-semibold text-white/80">
              アカウントにログイン
            </h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-blue-200">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-blue-400 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-blue-200">
                  パスワード
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-blue-400 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                  autoComplete="current-password"
                  required
                />
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-200">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-blue-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'ログイン中...' : 'ログイン'}
              </button>
            </form>
          </div>

          {/* 新規登録 */}
          <div className="mt-5 text-center space-y-2">
            <p className="text-sm text-blue-300">
              アカウントをお持ちでない方は{' '}
              <Link href="/signup" className="font-bold text-white underline-offset-2 hover:underline">
                新規登録
              </Link>
            </p>
            <p className="text-xs text-blue-400/60">
              <Link href="/privacy" className="hover:text-blue-300">プライバシーポリシー</Link>
              <span className="mx-2">·</span>
              <Link href="/terms" className="hover:text-blue-300">利用規約</Link>
              <span className="mx-2">·</span>
              <Link href="/security" className="hover:text-blue-300">セキュリティ</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
