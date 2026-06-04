'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function BuildingBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 380"
        className="absolute bottom-0 w-full"
        style={{ opacity: 0.38 }}
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <pattern id="win-sm" x="0" y="0" width="14" height="18" patternUnits="userSpaceOnUse">
            <rect x="3" y="4" width="7" height="9" rx="1" fill="#cbd5e1" opacity="0.55" />
          </pattern>
          <pattern id="win-md" x="0" y="0" width="18" height="22" patternUnits="userSpaceOnUse">
            <rect x="4" y="5" width="9" height="11" rx="1" fill="#cbd5e1" opacity="0.55" />
          </pattern>
        </defs>

        {/* Building 1 — wide, medium */}
        <rect x="0" y="190" width="110" height="190" fill="#64748b" />
        <rect x="0" y="190" width="110" height="190" fill="url(#win-sm)" />

        {/* Building 2 — tall narrow */}
        <rect x="120" y="70" width="65" height="310" fill="#475569" />
        <rect x="120" y="70" width="65" height="310" fill="url(#win-sm)" />
        {/* rooftop structure */}
        <rect x="135" y="55" width="35" height="18" fill="#475569" />

        {/* Building 3 — wide, medium-tall */}
        <rect x="195" y="130" width="120" height="250" fill="#64748b" />
        <rect x="195" y="130" width="120" height="250" fill="url(#win-md)" />

        {/* Building 4 — narrow, very tall */}
        <rect x="325" y="45" width="55" height="335" fill="#4b5563" />
        <rect x="325" y="45" width="55" height="335" fill="url(#win-sm)" />
        <rect x="336" y="30" width="32" height="18" fill="#4b5563" />

        {/* Building 5 — wide apartment */}
        <rect x="390" y="155" width="140" height="225" fill="#64748b" />
        <rect x="390" y="155" width="140" height="225" fill="url(#win-md)" />

        {/* Building 6 — medium */}
        <rect x="540" y="115" width="80" height="265" fill="#475569" />
        <rect x="540" y="115" width="80" height="265" fill="url(#win-sm)" />

        {/* Building 7 — tall */}
        <rect x="630" y="60" width="70" height="320" fill="#4b5563" />
        <rect x="630" y="60" width="70" height="320" fill="url(#win-sm)" />
        <rect x="645" y="44" width="40" height="18" fill="#4b5563" />

        {/* Building 8 — wide */}
        <rect x="710" y="140" width="130" height="240" fill="#64748b" />
        <rect x="710" y="140" width="130" height="240" fill="url(#win-md)" />

        {/* Building 9 — medium */}
        <rect x="850" y="100" width="75" height="280" fill="#475569" />
        <rect x="850" y="100" width="75" height="280" fill="url(#win-sm)" />

        {/* Building 10 — very tall */}
        <rect x="935" y="40" width="80" height="340" fill="#4b5563" />
        <rect x="935" y="40" width="80" height="340" fill="url(#win-sm)" />
        <rect x="950" y="24" width="50" height="18" fill="#4b5563" />

        {/* Building 11 — wide, lower */}
        <rect x="1025" y="175" width="115" height="205" fill="#64748b" />
        <rect x="1025" y="175" width="115" height="205" fill="url(#win-md)" />

        {/* Building 12 — narrow tall */}
        <rect x="1150" y="90" width="60" height="290" fill="#475569" />
        <rect x="1150" y="90" width="60" height="290" fill="url(#win-sm)" />

        {/* Building 13 — wide, right edge */}
        <rect x="1220" y="150" width="220" height="230" fill="#64748b" />
        <rect x="1220" y="150" width="220" height="230" fill="url(#win-md)" />

        {/* Ground line */}
        <rect x="0" y="376" width="1440" height="4" fill="#475569" />
      </svg>
    </div>
  )
}

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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMessage(error.message)
        return
      }

      router.replace('/dashboard')
      router.refresh()
    } catch {
      setErrorMessage('ログイン中に通信エラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200 px-4">
      <BuildingBackground />

      <div className="relative z-10 w-full max-w-sm">
        {/* Brand header */}
        <div className="rounded-t-lg bg-[#1e3a5f] px-6 py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-300">
            MANSION SaaS
          </p>
          <h1 className="mt-1 text-lg font-bold text-white">マンション管理アプリ</h1>
        </div>

        {/* Form card */}
        <div className="rounded-b-lg border border-t-0 border-gray-200 bg-white px-6 py-6 shadow-lg">
          <p className="mb-5 text-sm text-gray-500">
            アカウント情報を入力してログインしてください
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoComplete="current-password"
                required
              />
            </div>

            {errorMessage ? (
              <div className="rounded border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          分譲マンション管理会社向け業務支援システム
        </p>
        <p className="mt-2 text-center text-xs text-gray-400">
          <a href="/privacy" className="hover:text-gray-600 underline">プライバシーポリシー</a>
          <span className="mx-1">·</span>
          <a href="/terms" className="hover:text-gray-600 underline">利用規約</a>
        </p>
      </div>
    </div>
  )
}
