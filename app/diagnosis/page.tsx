'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { sendGAEvent, GA_EVENTS } from '@/lib/analytics'

const QUESTIONS = [
  {
    id: 'minutes',
    text: '理事会・総会の議事録作成に、1回あたり1時間以上かかっていますか？',
    sub: '文字起こし・清書・確認作業を含む合計時間',
    options: [
      { value: 2, label: 'よくある（ほぼ毎回）' },
      { value: 1, label: 'たまにある' },
      { value: 0, label: 'あまりない' },
    ],
  },
  {
    id: 'case_leak',
    text: '案件や対応事項の抜け漏れが発生することがありますか？',
    sub: '「あの件、どうなった？」という確認が発生する頻度',
    options: [
      { value: 2, label: 'よくある' },
      { value: 1, label: 'たまにある' },
      { value: 0, label: 'あまりない' },
    ],
  },
  {
    id: 'overview',
    text: '担当物件ごとの案件を一覧で把握できていますか？',
    sub: '「どの物件で何が進行中か」を即座に確認できるか',
    options: [
      { value: 0, label: 'できている' },
      { value: 1, label: 'なんとかできている' },
      { value: 2, label: 'できていない' },
    ],
  },
  {
    id: 'handover',
    text: '担当者が変わる際の引き継ぎに、1週間以上かかっていますか？',
    sub: '物件の背景・経緯・注意事項の共有期間',
    options: [
      { value: 2, label: 'よくかかる' },
      { value: 1, label: 'ときどきかかる' },
      { value: 0, label: 'あまりかからない' },
    ],
  },
  {
    id: 'past_search',
    text: '過去の対応内容や経緯を確認するのに時間がかかりますか？',
    sub: 'メール・ファイル・ノートを横断して探す頻度',
    options: [
      { value: 2, label: 'よくかかる' },
      { value: 1, label: 'ときどきかかる' },
      { value: 0, label: 'あまりかからない' },
    ],
  },
  {
    id: 'deadline',
    text: 'タスクや対応の期限管理に不安を感じることがありますか？',
    sub: '法定点検・修繕・クレーム対応の期限ミスリスク',
    options: [
      { value: 2, label: 'よくある' },
      { value: 1, label: 'たまにある' },
      { value: 0, label: 'あまりない' },
    ],
  },
]

type Answers = Record<string, number>

function calcResult(answers: Answers) {
  const minutesScore = answers['minutes'] ?? 0
  const caseScore = (answers['case_leak'] ?? 0) + (answers['overview'] ?? 0) + (answers['deadline'] ?? 0)
  const handoverScore = (answers['handover'] ?? 0) + (answers['past_search'] ?? 0)
  const total = Object.values(answers).reduce((s, v) => s + v, 0)

  const highlights: string[] = []
  const ctaType: 'minutes' | 'case' | 'all' =
    minutesScore >= 2 ? 'minutes'
    : caseScore >= 3 ? 'case'
    : 'all'

  if (minutesScore >= 2) highlights.push('議事録作成')
  if (caseScore >= 3) highlights.push('案件・タスク管理')
  if (handoverScore >= 2) highlights.push('引き継ぎ業務')
  if (highlights.length === 0) highlights.push('全体的な業務管理')

  let headline = ''
  let description = ''

  if (total <= 3) {
    headline = '業務管理は比較的整っています'
    description = '課題は限定的ですが、Kuraを使うことでさらに時間を短縮できる可能性があります。'
  } else if (total <= 7) {
    headline = 'いくつかの業務で改善余地があります'
    description = `特に「${highlights.join('・')}」に負担が集中している傾向があります。`
  } else {
    headline = '複数の業務で改善余地があります'
    description = `「${highlights.join('・')}」など、いくつかの領域で業務負担が高い傾向があります。Kuraの機能が直接対応できる課題です。`
  }

  return { headline, description, ctaType, highlights, total }
}

export default function DiagnosisPage() {
  const [step, setStep] = useState<'intro' | 'quiz' | 'result'>('intro')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    if (step === 'quiz' && current === 0) {
      sendGAEvent(GA_EVENTS.FREE_DIAGNOSIS_START)
    }
  }, [step, current])

  function startQuiz() {
    setStep('quiz')
    setCurrent(0)
    setAnswers({})
    setSelected(null)
  }

  function handleNext() {
    if (selected === null) return
    const q = QUESTIONS[current]
    const newAnswers = { ...answers, [q.id]: selected }
    setAnswers(newAnswers)
    setSelected(null)

    if (current + 1 < QUESTIONS.length) {
      setCurrent(c => c + 1)
    } else {
      sendGAEvent(GA_EVENTS.FREE_DIAGNOSIS_COMPLETE, { total_score: Object.values(newAnswers).reduce((s, v) => s + v, 0) })
      setStep('result')
    }
  }

  const result = step === 'result' ? calcResult(answers) : null

  return (
    <div className="min-h-screen bg-[#F6F3EC]">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/lp" className="text-[17px] font-semibold text-[#1C2B38] tracking-tight">Kura</Link>
          <div className="flex items-center gap-4">
            <Link href="/free-minutes" className="text-sm text-[#1A6B4A] hover:underline">無料AI議事録</Link>
            <Link href="/signup" className="rounded-full bg-[#1A6B4A] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#155C3E] transition-colors">
              無料で試す
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-4 py-12">

        {step === 'intro' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 text-center">
            <p className="text-xs font-semibold text-[#1A6B4A] uppercase tracking-widest mb-4">無料 · 登録不要 · 1分</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1C2B38] mb-4 leading-tight">
              マンション管理会社<br />業務効率化診断
            </h1>
            <p className="text-[#546471] text-base leading-relaxed mb-8 max-w-lg mx-auto">
              6つの質問に答えるだけで、自社の業務でどこに負担が集中しているかを確認できます。
              結果に応じて、改善のヒントをお伝えします。
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-[#546471] mb-10">
              {['所要1分', '登録不要', '無料'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-[#1A6B4A]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {t}
                </span>
              ))}
            </div>
            <button
              onClick={startQuiz}
              className="w-full sm:w-auto inline-block bg-[#1C2B38] text-white font-bold text-base px-10 py-4 rounded-2xl hover:bg-[#243547] transition"
            >
              診断をはじめる →
            </button>
            <p className="mt-4 text-xs text-[#9DB5BF]">回答内容が保存・送信されることはありません</p>
          </div>
        )}

        {step === 'quiz' && (
          <div>
            {/* Progress */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                <div
                  className="bg-[#1A6B4A] h-1.5 rounded-full transition-all"
                  style={{ width: `${((current + 1) / QUESTIONS.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-[#546471] shrink-0">{current + 1} / {QUESTIONS.length}</span>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-10">
              <p className="text-xs font-semibold text-[#1A6B4A] uppercase tracking-widest mb-4">
                Q{current + 1}
              </p>
              <h2 className="text-lg sm:text-xl font-bold text-[#1C2B38] mb-2 leading-snug">
                {QUESTIONS[current].text}
              </h2>
              <p className="text-sm text-[#546471] mb-8">{QUESTIONS[current].sub}</p>

              <div className="space-y-3">
                {QUESTIONS[current].options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSelected(opt.value)}
                    className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition text-[15px] font-medium ${
                      selected === opt.value
                        ? 'border-[#1A6B4A] bg-[#f0faf6] text-[#1A6B4A]'
                        : 'border-slate-200 text-[#1C2B38] hover:border-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-between">
                {current > 0 ? (
                  <button
                    onClick={() => { setCurrent(c => c - 1); setSelected(answers[QUESTIONS[current - 1].id] ?? null) }}
                    className="text-sm text-[#546471] hover:text-[#1C2B38]"
                  >
                    ← 戻る
                  </button>
                ) : <div />}
                <button
                  onClick={handleNext}
                  disabled={selected === null}
                  className="bg-[#1C2B38] text-white font-bold text-sm px-8 py-3 rounded-xl hover:bg-[#243547] transition disabled:opacity-30"
                >
                  {current + 1 < QUESTIONS.length ? '次へ →' : '結果を見る →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'result' && result && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-10">
              <p className="text-xs font-semibold text-[#1A6B4A] uppercase tracking-widest mb-4">診断結果</p>
              <h2 className="text-2xl font-bold text-[#1C2B38] mb-4 leading-snug">{result.headline}</h2>
              <p className="text-[#546471] text-base leading-relaxed mb-8">{result.description}</p>

              {result.highlights.length > 0 && (
                <div className="bg-[#F6F3EC] rounded-2xl p-5 mb-8">
                  <p className="text-xs font-semibold text-[#546471] mb-3">負担が集中している領域</p>
                  <div className="flex flex-wrap gap-2">
                    {result.highlights.map(h => (
                      <span key={h} className="bg-white border border-[#D4CFC5] text-[#1C2B38] text-sm font-medium px-3 py-1 rounded-full">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 議事録課題が高い場合 */}
              {result.ctaType === 'minutes' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border-2 border-[#1A6B4A] bg-[#f0faf6] p-6">
                    <p className="text-sm font-semibold text-[#1A6B4A] mb-1">まず試せること</p>
                    <p className="text-[#1C2B38] font-bold text-base mb-3">
                      AI議事録を1回無料で試してみる
                    </p>
                    <p className="text-sm text-[#546471] mb-4">
                      音声をアップロードするだけ。10〜15分で議事録の下書きが完成します。月2回まで無料・登録のみ。
                    </p>
                    <a
                      href="/free-minutes"
                      onClick={() => sendGAEvent(GA_EVENTS.FREE_DIAGNOSIS_TO_AI_MINUTES)}
                      className="inline-block bg-[#1A6B4A] text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#155C3E] transition"
                    >
                      AI議事録を無料で試す →
                    </a>
                  </div>
                  <a
                    href="/signup"
                    onClick={() => sendGAEvent(GA_EVENTS.FREE_DIAGNOSIS_TO_TRIAL)}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-400 transition group"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#1C2B38]">Kura全機能を14日間無料で試す</p>
                      <p className="text-xs text-[#546471] mt-0.5">案件管理・AI議事録・引き継ぎ書まで一括</p>
                    </div>
                    <svg className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </a>
                </div>
              )}

              {/* 案件/タスク課題が高い場合 */}
              {result.ctaType === 'case' && (
                <div className="space-y-4">
                  <a
                    href="/signup"
                    onClick={() => sendGAEvent(GA_EVENTS.FREE_DIAGNOSIS_TO_TRIAL)}
                    className="flex items-center justify-between rounded-2xl border-2 border-[#1A6B4A] bg-[#f0faf6] p-6 hover:bg-[#e8f5ee] transition group"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[#1A6B4A] mb-1">まず試せること</p>
                      <p className="text-base font-bold text-[#1C2B38] mb-1">Kuraを14日間無料で試す</p>
                      <p className="text-sm text-[#546471]">案件・タスク管理の全機能を無料トライアルで</p>
                    </div>
                    <svg className="h-5 w-5 text-[#1A6B4A] shrink-0 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </a>
                  <a
                    href="/free-minutes"
                    onClick={() => sendGAEvent(GA_EVENTS.FREE_DIAGNOSIS_TO_AI_MINUTES)}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-400 transition group"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#1C2B38]">AI議事録だけ先に試す</p>
                      <p className="text-xs text-[#546471] mt-0.5">月2回無料・登録のみ</p>
                    </div>
                    <svg className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </a>
                </div>
              )}

              {/* 全体的に高い場合 */}
              {result.ctaType === 'all' && (
                <div className="space-y-4">
                  <a
                    href="/signup"
                    onClick={() => sendGAEvent(GA_EVENTS.FREE_DIAGNOSIS_TO_TRIAL)}
                    className="flex items-center justify-between rounded-2xl border-2 border-[#1A6B4A] bg-[#f0faf6] p-6 hover:bg-[#e8f5ee] transition group"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[#1A6B4A] mb-1">おすすめ</p>
                      <p className="text-base font-bold text-[#1C2B38] mb-1">Kuraを14日間無料で試す</p>
                      <p className="text-sm text-[#546471]">全機能・クレジットカード不要</p>
                    </div>
                    <svg className="h-5 w-5 text-[#1A6B4A] shrink-0 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </a>
                  <a
                    href="/free-minutes"
                    onClick={() => sendGAEvent(GA_EVENTS.FREE_DIAGNOSIS_TO_AI_MINUTES)}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-400 transition group"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#1C2B38]">まずAI議事録だけ無料で試す</p>
                      <p className="text-xs text-[#546471] mt-0.5">月2回・登録のみ・カード不要</p>
                    </div>
                    <svg className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </a>
                </div>
              )}
            </div>

            {/* デモ動画 */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 text-center">
              <p className="text-sm text-[#546471] mb-3">まずKuraの実際の操作を確認したい方へ</p>
              <a href="/lp#demo" className="text-sm font-semibold text-[#1A6B4A] hover:underline">
                → デモ動画を見る
              </a>
            </div>

            <button
              onClick={startQuiz}
              className="w-full text-sm text-[#546471] hover:text-[#1C2B38] py-2"
            >
              もう一度診断する
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
