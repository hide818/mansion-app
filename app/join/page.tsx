'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import KuraLogo from '@/app/components/KuraLogo'

type InviteInfo = {
  email: string
  role: string
  companyName: string
}

const ROLE_LABEL: Record<string, string> = {
  admin: '管理者',
  general: '一般',
  viewer: '閲覧のみ',
}

function JoinForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') ?? ''

  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [loadError, setLoadError] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!token) { setLoadError('招待リンクが無効です。URLを確認してください。'); return }
    fetch(`/api/invitations/accept?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setLoadError(d.error); return }
        setInvite({ email: d.email, role: d.role, companyName: d.companyName })
      })
      .catch(() => setLoadError('招待情報の取得に失敗しました。'))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError('')
    if (password !== confirmPassword) { setSubmitError('パスワードが一致しません'); return }
    if (password.length < 8) { setSubmitError('パスワードは8文字以上にしてください'); return }
    if (!displayName.trim()) { setSubmitError('お名前を入力してください'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, displayName: displayName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setSubmitError(data.error ?? '登録に失敗しました'); return }

      // 自動ログイン
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invite!.email,
        password,
      })
      if (signInError) { router.push('/login'); return }
      router.replace('/dashboard')
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[#0f2240]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2240] via-[#1e3a5f] to-[#0f2240]" />
        <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-500 opacity-10 blur-3xl" />
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 200" className="w-full" preserveAspectRatio="xMidYMax slice">
          <rect x="0" y="100" width="45" height="100" fill="#1a3050" />
          <rect x="50" y="60" width="30" height="140" fill="#162840" />
          <rect x="85" y="80" width="50" height="120" fill="#1a3050" />
          <rect x="140" y="40" width="25" height="160" fill="#162840" />
          <rect x="170" y="70" width="60" height="130" fill="#1a3050" />
          <rect x="235" y="55" width="30" height="145" fill="#162840" />
          <rect x="270" y="85" width="45" height="115" fill="#1a3050" />
          <rect x="0" y="196" width="390" height="4" fill="#162840" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 text-center">
          <KuraLogo size={56} variant="seal" />
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white">Kura</h1>
        </div>

        <div className="w-full max-w-sm">
          {loadError ? (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/20 p-6 text-center">
              <p className="text-2xl mb-2">⚠️</p>
              <p className="text-sm text-red-200">{loadError}</p>
            </div>
          ) : !invite ? (
            <div className="rounded-2xl border border-white/10 bg-white/10 p-6 text-center">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              <p className="mt-3 text-sm text-blue-200">招待情報を確認中...</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
              {/* 招待情報 */}
              <div className="mb-5 rounded-xl bg-blue-500/20 border border-blue-400/30 p-3 text-center">
                <p className="text-xs text-blue-300 mb-1">招待元</p>
                <p className="text-base font-bold text-white">{invite.companyName}</p>
                <p className="text-xs text-blue-200 mt-1">
                  {invite.email} · 権限: {ROLE_LABEL[invite.role] ?? invite.role}
                </p>
              </div>

              <h2 className="mb-4 text-center text-sm font-semibold text-white/80">
                アカウントを作成して参加する
              </h2>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-blue-200">お名前</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="例: 山田 太郎"
                    required
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-blue-200">メールアドレス</label>
                  <input
                    type="email"
                    value={invite.email}
                    readOnly
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/50 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-blue-200">パスワード（8文字以上）</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="パスワードを設定"
                    required
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-blue-200">パスワード（確認）</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="もう一度入力"
                    required
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-blue-400 focus:outline-none"
                  />
                </div>

                {submitError && (
                  <div className="rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-200">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 w-full rounded-xl bg-blue-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400 active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? '登録中...' : `${invite.companyName} に参加する`}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinForm />
    </Suspense>
  )
}
