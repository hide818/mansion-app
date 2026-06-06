'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">

      {/* ヘッダー */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </div>
          <span className="text-xl font-extrabold text-slate-800 tracking-tight">Kura</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="#contact" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition">お問い合わせ</a>
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            ログイン
          </Link>
        </div>
      </header>

      {/* ヒーロー */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-600">
          マンション管理会社専用 AI SaaS
        </div>
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          担当者が辞めても、<br className="hidden sm:block" />
          <span className="text-blue-600">マンション管理は止まらない。</span>
        </h1>
        <p className="mt-6 text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto">
          属人化を根絶するAI搭載SaaS。案件・タスクを全物件で一元管理し、
          音声から議事録を自動生成。引き継ぎ書もAIが瞬時に作成します。
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#contact"
            className="rounded-xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white hover:bg-blue-700 transition shadow-md"
          >
            デモを申し込む
          </a>
          <a
            href="#features"
            className="rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            機能を見る
          </a>
        </div>
      </section>

      {/* 課題提示 */}
      <section className="bg-slate-900 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-xl font-bold text-white mb-10">管理会社が抱えるこんな課題、ありませんか？</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: '😰', text: '担当者が退職して引き継ぎが曖昧になった' },
              { icon: '📝', text: '議事録の作成に毎回1〜2時間かかっている' },
              { icon: '🔥', text: '案件の抜け漏れで居住者からクレームが来た' },
            ].map(({ icon, text }) => (
              <div key={text} className="rounded-xl bg-slate-800 p-5 text-center">
                <div className="text-3xl mb-3">{icon}</div>
                <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-blue-400 font-bold mt-8 text-lg">
            Kura はこれを全部解決します。
          </p>
        </div>
      </section>

      {/* 3本柱 */}
      <section id="features" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-bold text-slate-900 mb-3">
            3つの機能で、管理会社が変わる
          </h2>
          <p className="text-center text-slate-500 text-sm mb-12">
            現場で本当に使える機能だけを磨き込みました
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            <FeatureCard
              icon="📋"
              title="案件・タスク管理"
              description="全物件の案件・タスクを一覧で把握。期限切れ・停滞・クレームを自動アラート。誰が担当していても状況が見える。"
              badge="属人化防止"
            />
            <FeatureCard
              icon="🎙️"
              title="AI議事録"
              description="会議の録音をアップロードするだけ。AIが文字起こし〜議事録作成まで自動化。自社フォーマットにも対応。"
              badge="30分→3分"
            />
            <FeatureCard
              icon="📄"
              title="AI引き継ぎ書"
              description="物件を選ぶだけでAIが引き継ぎ書を自動生成。担当交代時のミスゼロ。新人でも即戦力に。"
              badge="引き継ぎ革命"
            />
          </div>
        </div>
      </section>

      {/* 数字で語る */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-2xl font-bold text-slate-900 mb-12">
            現場の時間を取り戻す
          </h2>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <StatCard number="70%" label="議事録作成時間を削減" />
            <StatCard number="0件" label="引き継ぎ漏れ" />
            <StatCard number="全物件" label="案件を一画面で把握" />
            <StatCard number="30分" label="で導入完了" />
          </div>
        </div>
      </section>

      {/* 料金プラン */}
      <section id="pricing" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-2xl font-bold text-slate-900 mb-3">料金プラン</h2>
          <p className="text-center text-slate-500 text-sm mb-12">
            すべてのプランに全AI機能が含まれます。初期費用・最低契約期間なし。
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            <PricingCard
              name="スタータープラン"
              price="¥30,000"
              unit="/月"
              desc="物件数 〜30棟"
              features={['案件・タスク管理', 'AI議事録（自社フォーマット対応）', 'AI引き継ぎ書', 'ユーザー3名まで']}
            />
            <PricingCard
              name="スタンダードプラン"
              price="¥50,000"
              unit="/月"
              desc="物件数 〜100棟"
              features={['案件・タスク管理', 'AI議事録（自社フォーマット対応）', 'AI引き継ぎ書', 'ユーザー10名まで', '管理者ダッシュボード', 'CSVエクスポート']}
              recommended
            />
            <PricingCard
              name="エンタープライズ"
              price="¥100,000"
              unit="/月"
              desc="物件数 無制限"
              features={['全機能', 'ユーザー無制限', '専用サポート', 'カスタム対応', 'SLA保証']}
            />
          </div>
          <p className="text-center text-xs text-slate-400 mt-6">※ 税抜表示。消費税は別途申し受けます。</p>
        </div>
      </section>

      {/* お問い合わせ */}
      <ContactSection />

      {/* フッター */}
      <footer className="border-t border-slate-100 px-8 py-8 text-center text-xs text-slate-400">
        <div className="mb-3 flex items-center justify-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">K</span>
          </div>
          <span className="font-bold text-slate-600">Kura</span>
        </div>
        <div className="flex justify-center gap-6 mb-3">
          <Link href="/terms" className="hover:text-slate-600">利用規約</Link>
          <Link href="/privacy" className="hover:text-slate-600">プライバシーポリシー</Link>
          <Link href="/login" className="hover:text-slate-600">ログイン</Link>
        </div>
        © 2026 Kura. All rights reserved.
      </footer>

    </main>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  badge,
}: {
  icon: string
  title: string
  description: string
  badge: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-3 text-3xl">{icon}</div>
      <div className="mb-2 inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
        {badge}
      </div>
      <h3 className="mt-1 text-base font-bold text-slate-800">{title}</h3>
      <p className="mt-2 text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-extrabold text-blue-600">{number}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  )
}

function PricingCard({
  name,
  price,
  unit,
  desc,
  features,
  recommended,
}: {
  name: string
  price: string
  unit: string
  desc: string
  features: string[]
  recommended?: boolean
}) {
  return (
    <div
      className={`relative rounded-2xl border p-6 ${
        recommended
          ? 'border-blue-500 bg-blue-600 text-white shadow-lg'
          : 'border-slate-200 bg-white text-slate-900'
      }`}
    >
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-bold text-slate-900">
          人気No.1
        </div>
      )}
      <div className={`text-xs font-semibold mb-1 ${recommended ? 'text-blue-100' : 'text-slate-500'}`}>{desc}</div>
      <div className="text-lg font-bold mb-0.5">{name}</div>
      <div className="mt-3 flex items-end gap-1">
        <span className="text-3xl font-extrabold">{price}</span>
        <span className={`text-sm mb-1 ${recommended ? 'text-blue-100' : 'text-slate-400'}`}>{unit}（税抜）</span>
      </div>
      <ul className="mt-5 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <span className={recommended ? 'text-blue-200' : 'text-blue-500'}>✓</span>
            {f}
          </li>
        ))}
      </ul>
      <a
        href="#contact"
        className={`mt-6 block rounded-xl py-2.5 text-center text-sm font-bold transition ${
          recommended
            ? 'bg-white text-blue-600 hover:bg-blue-50'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        デモを申し込む
      </a>
    </div>
  )
}

function ContactSection() {
  const [form, setForm] = useState({ company: '', name: '', email: '', propertyCount: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
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

  return (
    <section id="contact" className="py-20">
      <div className="mx-auto max-w-xl px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900 mb-3">デモ・お問い合わせ</h2>
        <p className="text-center text-slate-500 text-sm mb-10">
          30分のオンラインデモで、貴社の業務への活用イメージをお見せします。
        </p>

        {status === 'done' ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-bold text-green-800">お問い合わせを受け付けました</p>
            <p className="text-sm text-green-600 mt-1">通常1営業日以内にご連絡します。</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">会社名</label>
                <input name="company" value={form.company} onChange={handleChange} type="text" placeholder="〇〇マンション管理株式会社" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">お名前 <span className="text-red-500">*</span></label>
                <input name="name" value={form.name} onChange={handleChange} type="text" placeholder="山田 太郎" required className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">メールアドレス <span className="text-red-500">*</span></label>
                <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="yamada@example.com" required className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">管理物件数（目安）</label>
                <select name="propertyCount" value={form.propertyCount} onChange={handleChange} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                  <option value="">選択してください</option>
                  <option>10棟未満</option>
                  <option>10〜30棟</option>
                  <option>30〜100棟</option>
                  <option>100棟以上</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ご質問・ご要望（任意）</label>
                <textarea name="message" value={form.message} onChange={handleChange} rows={3} placeholder="気になっていることを自由にご記入ください" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              {status === 'error' && (
                <p className="text-sm text-red-600">送信に失敗しました。時間をおいて再度お試しください。</p>
              )}
              <button type="submit" disabled={status === 'loading'} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 transition disabled:opacity-50">
                {status === 'loading' ? '送信中...' : 'デモを申し込む（無料）'}
              </button>
              <p className="text-center text-xs text-slate-400">通常1営業日以内にご連絡します</p>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}
