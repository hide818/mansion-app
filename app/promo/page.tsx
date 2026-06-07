'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import KuraLogo from '@/app/components/KuraLogo'

const TOTAL = 54

export default function PromoPage() {
  const [t, setT] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const raf = useRef<number | null>(null)
  const startTime = useRef<number>(0)

  const tick = useCallback((now: number) => {
    const elapsed = (now - startTime.current) / 1000
    if (elapsed >= TOTAL) {
      setT(TOTAL)
      setPlaying(false)
      return
    }
    setT(+elapsed.toFixed(2))
    raf.current = requestAnimationFrame(tick)
  }, [])

  function play() {
    if (raf.current) cancelAnimationFrame(raf.current)
    startTime.current = performance.now()
    setT(0)
    setPlaying(true)
    raf.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [])

  // opacity: fade in over fi sec, hold, fade out over fo sec
  function op(s: number, e: number, fi = 0.6, fo = 0.6): number {
    if (t < 0 || t < s || t >= e) return 0
    if (t < s + fi) return (t - s) / fi
    if (t > e - fo) return (e - t) / fo
    return 1
  }

  function st(s: number, e: number, fi = 0.6, fo = 0.6, extra: React.CSSProperties = {}): React.CSSProperties {
    return { opacity: op(s, e, fi, fo), transition: 'opacity 0.08s linear', pointerEvents: op(s, e) > 0 ? 'auto' : 'none', ...extra }
  }

  const progressPct = Math.max(0, Math.min(100, ((t - 20.5) / 5) * 100))
  const done = t >= TOTAL

  // ── Start screen ──────────────────────────────────────────────
  if (t < 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black">
        <KuraLogo size={80} variant="seal" />
        <h1 className="mb-1 text-3xl font-extrabold tracking-tight text-white">Kura</h1>
        <p className="mb-16 text-xs font-medium text-white/30 tracking-widest uppercase">管理会社専用AI</p>
        <button
          onClick={play}
          className="group flex h-18 w-18 items-center justify-center rounded-full border border-white/20 bg-white/10 p-5 hover:bg-white/20 transition-all duration-300"
          aria-label="再生"
        >
          <svg className="h-7 w-7 translate-x-0.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        <p className="mt-5 text-xs text-white/20">タップして再生 · 36秒</p>
      </div>
    )
  }

  // ── Promo ─────────────────────────────────────────────────────
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black select-none">

      {/* ══ Scene 1: Late night 22:00 ══════════════════════════ */}
      <div style={st(0.5, 7)} className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <p style={st(0.8, 6.5, 0.5, 0.5)} className="text-xl font-bold tracking-wider text-white/60">
          総会、終了。
        </p>
        <div style={st(1, 7, 0.4, 0.6)} className="font-mono text-[88px] font-extralight leading-none text-white sm:text-[110px]">
          22<span className="animate-pulse opacity-70">:</span>00
        </div>
        <div style={st(2, 7, 0.4, 0.4)} className="mt-2 flex items-center gap-2 text-sm text-white/25">
          <span>議事録を作成しています</span>
          <span className="inline-block h-4 w-px animate-pulse bg-white/40" />
        </div>
      </div>

      {/* ══ Scene 2: 1時間後 23:15 ════════════════════════════ */}
      <div style={st(7, 12.5)} className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <p style={st(7.3, 12, 0.4, 0.4)} className="text-xl font-bold tracking-wider text-white/50">
          1時間が経過した。
        </p>
        <div style={st(7.5, 12.5, 0.4, 0.5)} className="font-mono text-[88px] font-extralight leading-none text-white/60 sm:text-[110px]">
          23<span className="animate-pulse opacity-70">:</span>15
        </div>
        <div style={st(8, 12, 0.4, 0.4)} className="mt-2 text-base font-medium text-white/35">
          まだ書いている。
        </div>
      </div>

      {/* ══ Scene 3: "2時間" 大文字 ════════════════════════════ */}
      <div style={st(12.5, 18)} className="absolute inset-0 flex flex-col items-center justify-center">
        <p style={st(12.8, 17.5, 0.4, 0.4)} className="mb-2 text-base font-light text-white/40">
          総会議事録の作成にかかる時間
        </p>
        <div style={st(13, 18, 0.3, 0.5)} className="text-[100px] font-black leading-none tracking-tight text-white sm:text-[130px]">
          2時間
        </div>
        <p style={st(14, 18, 0.4, 0.4)} className="mt-3 text-sm text-white/25">
          毎月、繰り返される。
        </p>
      </div>

      {/* ══ Scene 4: Kura UI ═══════════════════════════════════ */}
      <div style={st(19, 28)} className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <div style={st(19, 28, 0.5, 0.5)} className="w-full max-w-[340px] overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500">
              <span className="text-xs font-extrabold text-white">K</span>
            </div>
            <span className="text-sm font-bold text-white">AI議事録</span>
            <span className="ml-auto text-[10px] text-white/30">音声を入れるだけ</span>
          </div>

          <div className="p-5 space-y-4">
            {/* Audio file */}
            <div style={st(19.5, 27.5, 0.4, 0.4)} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/20">
                <svg className="h-4 w-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white">総会_2024-06-07.m4a</p>
                <p className="text-[10px] text-white/30">1時間12分 · 87MB</p>
              </div>
            </div>

            {/* Progress bar */}
            <div style={st(20.5, 25.5, 0.4, 0.5)} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-blue-300">AI処理中...</span>
                <span className="text-[11px] tabular-nums text-blue-300">{Math.round(progressPct)}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                  style={{ width: `${progressPct}%`, transition: 'width 0.05s linear' }}
                />
              </div>
              <p className="text-[10px] text-white/20">
                {progressPct < 30 ? '音声を解析中...' : progressPct < 70 ? '議事録を生成中...' : 'タスクを抽出中...'}
              </p>
            </div>

            {/* Complete */}
            <div style={st(25.5, 28, 0.5, 0.4)} className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-500">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-green-400">議事録を生成しました</p>
                <p className="text-[10px] text-green-400/60">タスク 4件を自動抽出</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Scene 5: 完成した議事録 ════════════════════════════ */}
      <div
        style={{
          ...st(28.5, 35),
          transform: `translateY(${op(28.5, 35) < 0.5 && op(28.5, 35) > 0 ? `${(1 - op(28.5, 35) * 2) * 16}px` : '0px'})`,
          transition: 'opacity 0.08s linear, transform 0.4s cubic-bezier(0.22,1,0.36,1)',
        }}
        className="absolute inset-0 flex flex-col items-center justify-center px-6"
      >
        <div className="w-full max-w-[340px] rounded-2xl bg-white p-6 shadow-2xl">
          <div className="mb-4 border-b border-slate-100 pb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">第12回 定期総会 議事録</p>
            <p className="mt-0.5 text-base font-bold text-slate-800">2024年6月7日（金）</p>
          </div>
          <div className="space-y-2.5">
            <div className="h-2 rounded-full bg-slate-200" style={{ width: '92%' }} />
            <div className="h-2 rounded-full bg-slate-200" style={{ width: '78%' }} />
            <div className="h-2 rounded-full bg-slate-200" style={{ width: '85%' }} />
            <div className="h-2 rounded-full bg-slate-100" style={{ width: '55%' }} />
            <div className="h-2 rounded-full bg-slate-200" style={{ width: '88%' }} />
            <div className="h-2 rounded-full bg-slate-100" style={{ width: '65%' }} />
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
              <p className="mb-2 text-[10px] font-bold text-blue-700">宿題・次回タスク（AI自動抽出）</p>
              <div className="space-y-1.5">
                {['修繕積立金の見直し案を作成', '消防設備点検の日程調整', '駐車場規約の改訂', '総会日程の候補を提示'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    <div className="h-1.5 rounded-full bg-blue-200" style={{ width: `${[75, 65, 70, 80][i]}%` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Scene 6: "50分。" ══════════════════════════════════ */}
      <div style={st(35.5, 45)} className="absolute inset-0 flex flex-col items-center justify-center">
        <div style={st(35.5, 45, 0.3, 0.6)} className="text-center">
          <div className="text-[90px] font-black leading-none tracking-tight text-white sm:text-[120px]">
            50分。
          </div>
          <p style={st(36, 45, 0.4, 0.4)} className="mt-3 text-base text-white/40">
            以前は2時間かかっていた。
          </p>
          <p style={st(37.5, 45, 0.5, 0.4)} className="mt-2 text-lg font-semibold text-white/70">
            あなたの会社でも、できます。
          </p>
        </div>
      </div>

      {/* ══ Scene 7: Logo + CTA（8秒キープ） ════════════════════ */}
      <div style={st(45.5, TOTAL, 0.8, 0)} className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <KuraLogo size={64} variant="seal" />
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Kura</h1>
        <p className="text-xs font-medium tracking-[0.25em] text-white/40 uppercase">管理会社専用AI</p>
        <Link
          href="/signup"
          className="mt-3 rounded-xl bg-blue-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-400 transition-colors"
        >
          まず3ヶ月、無料で試す
        </Link>
        <p className="mt-1 text-xs text-white/25">初期3社限定 · クレジットカード不要</p>
      </div>

      {/* Progress bar */}
      {(playing || done) && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10">
          <div
            className="h-px bg-white/40"
            style={{ width: `${(Math.max(0, t) / TOTAL) * 100}%`, transition: 'width 0.05s linear' }}
          />
        </div>
      )}

      {/* Replay */}
      {done && (
        <button
          onClick={play}
          className="absolute bottom-6 right-6 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-white/60 hover:bg-white/20 hover:text-white transition-all"
        >
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
          </svg>
          もう一度
        </button>
      )}
    </div>
  )
}
