'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'

type Status = {
  isFreeMinutesUser: boolean
  yearMonth: string
  usedCount: number
  maxUses: number
  remaining: number
  surveyBonus: boolean
  hasUsedOnce: boolean
  surveyAnsweredThisMonth: boolean
  ctaClicked: boolean
} | null

export default function FreeMinutesPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string } | null | undefined>(undefined)
  const [status, setStatus] = useState<Status>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [showSignup, setShowSignup] = useState(false)

  // signup form
  const [companyName, setCompanyName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [signupDone, setSignupDone] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
    })
  }, [])

  useEffect(() => {
    if (user) {
      setLoadingStatus(true)
      fetch('/api/free-minutes/status')
        .then(r => r.json())
        .then(d => setStatus(d))
        .finally(() => setLoadingStatus(false))
    }
  }, [user])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setSignupLoading(true)
    setSignupError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName, companyName, source: 'free_minutes' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '登録に失敗しました')

      // ログイン
      const supabase = createSupabaseBrowserClient()
      const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password })
      if (loginErr) throw new Error('登録は完了しましたが、ログインに失敗しました。ログインページからお試しください。')

      setSignupDone(true)
      setTimeout(() => router.push('/ai-minutes'), 1500)
    } catch (err: unknown) {
      setSignupError(err instanceof Error ? err.message : '登録に失敗しました')
    } finally {
      setSignupLoading(false)
    }
  }

  function handleCTAClick() {
    fetch('/api/free-minutes/cta-click', { method: 'POST' }).catch(() => {})
    router.push('/signup')
  }

  const isLoggedIn = user != null
  const isFreeUser = status?.isFreeMinutesUser
  const remaining = status?.remaining ?? 0
  const maxUses = status?.maxUses ?? 2
  const usedCount = status?.usedCount ?? 0

  return (
    <div className="min-h-screen bg-white">
      {/* SEO head via metadata is in layout; this is client-only page */}

      {/* Hero */}
      <header className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-3 py-1 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            無料・登録のみ・クレカ不要
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 leading-tight">
            AI議事録、<br className="sm:hidden" />月2回まで無料
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mb-8 leading-relaxed">
            理事会・総会の録音をアップロードするだけ。10〜15分で議事録が完成します。<br />
            分譲マンション管理会社向けに特化した精度で、修正の手間を大幅に削減。
          </p>
          {!isLoggedIn && (
            <button
              onClick={() => setShowSignup(true)}
              className="bg-white text-slate-900 font-bold text-base px-8 py-4 rounded-2xl hover:bg-white/90 transition shadow-lg"
            >
              無料で試してみる →
            </button>
          )}
          {isLoggedIn && isFreeUser && (
            <button
              onClick={() => router.push('/ai-minutes')}
              className="bg-white text-slate-900 font-bold text-base px-8 py-4 rounded-2xl hover:bg-white/90 transition shadow-lg"
            >
              AI議事録を使う →
            </button>
          )}
          {isLoggedIn && !isFreeUser && !loadingStatus && (
            <button
              onClick={() => router.push('/ai-minutes')}
              className="bg-white text-slate-900 font-bold text-base px-8 py-4 rounded-2xl hover:bg-white/90 transition shadow-lg"
            >
              AI議事録を開く →
            </button>
          )}
        </div>
      </header>

      {/* ログイン済み・無料ユーザー向けステータス */}
      {isLoggedIn && isFreeUser && !loadingStatus && (
        <section className="bg-slate-50 border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row gap-6 items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">{status?.yearMonth} 利用状況</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-slate-900">{remaining}</span>
                  <span className="text-slate-500 mb-1">/ {maxUses}回 残り</span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {Array.from({ length: maxUses }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 w-8 rounded-full ${i < usedCount ? 'bg-slate-300' : 'bg-emerald-500'}`}
                    />
                  ))}
                </div>
                {!status?.surveyBonus && status?.hasUsedOnce && !status?.surveyAnsweredThisMonth && (
                  <p className="text-xs text-slate-500 mt-2">
                    アンケートに回答すると今月さらに1回追加されます
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 min-w-[160px]">
                <button
                  onClick={() => router.push('/ai-minutes')}
                  className="bg-slate-900 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-slate-800 transition text-center"
                >
                  AI議事録を使う
                </button>
                {remaining === 0 && (
                  <button
                    onClick={handleCTAClick}
                    className="bg-emerald-600 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-emerald-700 transition text-center"
                  >
                    無制限プランを見る
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 使い方 */}
      <section className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-12 text-center">3ステップで完成</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            { step: '01', title: '録音をアップロード', desc: 'MP3・M4A・WAV・MP4に対応。スマホで録音したファイルそのままでOK。' },
            { step: '02', title: 'マンション名と議題を入力', desc: '物件名と審議した議題を入力。議事録の構成が自動で整います。' },
            { step: '03', title: '議事録が生成される', desc: 'AI が文字起こしから要点整理まで自動で処理。10〜15分で完成します。' },
          ].map(item => (
            <div key={item.step} className="flex flex-col items-start">
              <span className="text-sm font-bold text-emerald-600 mb-3 tracking-widest">{item.step}</span>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 特徴 */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-12 text-center">できること</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: '文字起こし＋議事録の下書きを自動生成', desc: '録音を文字起こしし、議題に沿った議事録の下書きをAIが作成。清書・転記の手間を大幅に削減できます。' },
              { title: '議事録フォーマットを学習（有料機能）', desc: '自社の過去議事録を登録すると、表現や構成を反映した議事録を生成できます。無料プランでは標準フォーマットで生成されます。' },
              { title: 'アクション項目の自動抽出', desc: '「〇〇を確認する」「見積を取る」などの宿題を議事録から自動で一覧化します。' },
              { title: '承認・共有ワークフロー（有料機能）', desc: '生成した議事録をKura内で管理し、担当者→マネージャー→理事長への確認依頼を一元管理できます。' },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 料金 */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 text-center">シンプルな料金体系</h2>
        <p className="text-center text-slate-500 text-sm mb-12">まず無料で試して、必要になったら切り替えるだけ</p>
        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="rounded-2xl border-2 border-slate-200 p-8">
            <div className="text-sm font-medium text-slate-500 mb-2">無料プラン</div>
            <div className="text-3xl font-bold text-slate-900 mb-1">¥0</div>
            <div className="text-sm text-slate-500 mb-6">月2回まで</div>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span>AI議事録（月2回）</li>
              <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span>アンケート回答で+1回</li>
              <li className="flex items-start gap-2"><span className="text-slate-300 mt-0.5">✕</span><span className="text-slate-400">案件・タスク管理</span></li>
              <li className="flex items-start gap-2"><span className="text-slate-300 mt-0.5">✕</span><span className="text-slate-400">引き継ぎAI・テンプレート学習</span></li>
            </ul>
          </div>
          <div className="rounded-2xl border-2 border-slate-900 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">おすすめ</div>
            <div className="text-sm font-medium text-slate-500 mb-2">Kura スターター</div>
            <div className="text-3xl font-bold text-slate-900 mb-1">¥50,000</div>
            <div className="text-sm text-slate-500 mb-6">/月（税抜）〜</div>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span>AI議事録（無制限）</li>
              <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span>案件・タスク管理</li>
              <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span>引き継ぎAI</li>
              <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span>自社フォーマット学習</li>
            </ul>
            <button
              onClick={isLoggedIn ? handleCTAClick : () => setShowSignup(true)}
              className="mt-6 w-full bg-slate-900 text-white font-bold text-sm py-3 rounded-xl hover:bg-slate-800 transition"
            >
              14日間無料で試す
            </button>
          </div>
        </div>
      </section>

      {/* 登録モーダル */}
      {showSignup && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setShowSignup(false)}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            {signupDone ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">登録完了</h3>
                <p className="text-slate-500 text-sm">AI議事録ページに移動します…</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900">無料アカウント登録</h2>
                  <button onClick={() => setShowSignup(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
                </div>
                <p className="text-sm text-slate-500 mb-6">
                  登録後すぐにAI議事録を月2回まで無料でご利用いただけます。クレジットカード不要。
                </p>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">会社名 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      required
                      placeholder="〇〇マンション管理株式会社"
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">お名前</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="山田 太郎"
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">メールアドレス <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="yamada@example.co.jp"
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">パスワード <span className="text-red-500">*</span></label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="8文字以上"
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  {signupError && (
                    <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{signupError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={signupLoading}
                    className="w-full bg-slate-900 text-white font-bold text-sm py-3 rounded-xl hover:bg-slate-800 transition disabled:opacity-50"
                  >
                    {signupLoading ? '登録中…' : '無料で登録してAI議事録を試す'}
                  </button>
                  <p className="text-xs text-slate-400 text-center">
                    登録することで<a href="/terms" className="underline">利用規約</a>・<a href="/privacy" className="underline">プライバシーポリシー</a>に同意したものとみなします
                  </p>
                </form>
                <div className="mt-6 text-center">
                  <span className="text-sm text-slate-500">すでにアカウントをお持ちの方は</span>{' '}
                  <a href="/login" className="text-sm font-medium text-slate-900 underline">ログイン</a>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* フッター CTA */}
      {!isLoggedIn && (
        <section className="bg-slate-900 text-white">
          <div className="max-w-5xl mx-auto px-4 py-16 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">今すぐ試してみませんか？</h2>
            <p className="text-white/60 mb-8">登録30秒・クレジットカード不要・月2回無料</p>
            <button
              onClick={() => setShowSignup(true)}
              className="bg-white text-slate-900 font-bold text-base px-8 py-4 rounded-2xl hover:bg-white/90 transition"
            >
              無料アカウントを作成する →
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
