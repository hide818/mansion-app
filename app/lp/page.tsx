import Link from 'next/link'

export const metadata = {
  title: 'Kura — 担当者が辞めても止まらない管理会社へ',
  description: '分譲マンション管理会社向けAI業務管理SaaS。案件タスク管理・AI議事録・引き継ぎ書自動生成で属人化を解消。',
}

const PROBLEMS = [
  {
    title: '担当者が退職するたびに業務が止まる',
    body: '引き継ぎに1〜3ヶ月かかる。顧客クレームが多発する。「前の担当者しか知らない」情報が蒸発する。',
  },
  {
    title: '議事録作成に毎回2〜3時間かかる',
    body: '総会・理事会の議事録を毎回ゼロから作成。書記担当者のスキルで品質がバラバラ。校正・確認作業も膨大。',
  },
  {
    title: '法定点検の期限管理がExcelで限界',
    body: 'エレベーター・消防・貯水槽の点検期限が担当者のExcelに散在。ミス1件で管理組合への賠償リスク。',
  },
]

const FEATURES = [
  {
    tag: '3本柱①',
    title: '案件・タスク管理',
    desc: '全物件の業務を一元管理。担当者ごとの進捗・期限・アラートをリアルタイム可視化。「誰が何をいつまでにやるか」が常に明確。',
    color: 'bg-blue-50 border-blue-200',
    tagColor: 'bg-blue-600',
  },
  {
    tag: '3本柱②',
    title: 'AI議事録（自社フォーマット対応）',
    desc: '音声をアップロードするだけで議事録を自動生成。御社のフォーマット・文体をAIが学習し、次回から自動適用。さらに宿題・タスクも自動抽出。',
    color: 'bg-purple-50 border-purple-200',
    tagColor: 'bg-purple-600',
  },
  {
    tag: '3本柱③',
    title: 'AI引き継ぎ書自動生成',
    desc: '物件を選ぶだけで引き継ぎ書を自動生成。案件履歴・特記事項・居住者情報をAIが整理。担当交代のコストを最小化。',
    color: 'bg-emerald-50 border-emerald-200',
    tagColor: 'bg-emerald-600',
  },
  {
    tag: 'オプション',
    title: '法定点検・修繕・管理費督促',
    desc: '法定点検の期限アラート、修繕履歴管理、管理費未払いの督促メール送信まで一元管理。',
    color: 'bg-orange-50 border-orange-200',
    tagColor: 'bg-orange-500',
  },
]

const PRICING = [
  {
    name: 'トライアル',
    price: '無料',
    period: '3ヶ月間',
    desc: '初期3社限定',
    features: ['全機能が利用可能', '物件数無制限', 'ユーザー数3名まで', 'メールサポート'],
    cta: '無料で始める',
    ctaHref: '/signup',
    highlight: false,
  },
  {
    name: 'スタンダード',
    price: '¥30,000',
    period: '/ 月（税抜）',
    desc: '中小管理会社向け',
    features: ['全機能が利用可能', '物件数無制限', 'ユーザー数10名まで', 'メール・チャットサポート'],
    cta: '資料請求・お問い合わせ',
    ctaHref: 'mailto:info@kura-app.com',
    highlight: true,
  },
  {
    name: 'プロ',
    price: '¥50,000',
    period: '/ 月（税抜）',
    desc: '中堅管理会社向け',
    features: ['全機能が利用可能', '物件数・ユーザー数無制限', '専任サポート担当', 'CSV一括インポート支援', '稟議用セキュリティ資料'],
    cta: '資料請求・お問い合わせ',
    ctaHref: 'mailto:info@kura-app.com',
    highlight: false,
  },
]

export default function LpPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ナビ */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-sm font-extrabold text-white">K</span>
            </div>
            <span className="text-lg font-extrabold text-slate-900">Kura</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">ログイン</Link>
            <Link href="/signup" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
              無料で試す
            </Link>
          </div>
        </div>
      </nav>

      {/* ヒーロー */}
      <section className="relative overflow-hidden bg-[#0f2240] px-6 py-24 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f2240] via-[#1e3a5f] to-[#0f2240]" />
          <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500 opacity-10 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="mb-4 inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-300">
            分譲マンション管理会社専用 AI業務管理SaaS
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            担当者が辞めても、<br />業務は止まらない。
          </h1>
          <p className="mt-6 text-lg leading-8 text-blue-200">
            案件管理・AI議事録・引き継ぎ書自動生成の3本柱で、<br className="hidden sm:block" />
            管理会社の属人化を根本から解消するSaaSです。
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-400">
              まず無料で試してみる
            </Link>
            <Link href="#features"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white hover:bg-white/10">
              機能を見る
            </Link>
          </div>
          <p className="mt-4 text-xs text-blue-400/60">初期3社限定：3ヶ月間 完全無料 · クレジットカード不要</p>
        </div>
      </section>

      {/* 課題セクション */}
      <section className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-blue-600">Problem</p>
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">管理会社が抱える3つの課題</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {PROBLEMS.map((p, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                  <span className="text-lg font-bold text-red-500">{i + 1}</span>
                </div>
                <h3 className="mb-2 font-bold text-slate-800">{p.title}</h3>
                <p className="text-sm leading-6 text-slate-500">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 機能セクション */}
      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-blue-600">Features</p>
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">Kuraでできること</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className={`rounded-2xl border p-6 ${f.color}`}>
                <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-bold text-white ${f.tagColor}`}>
                  {f.tag}
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="text-sm leading-6 text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROIセクション */}
      <section className="bg-blue-600 px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-200">ROI</p>
          <h2 className="mb-8 text-3xl font-bold">月5万円で何が変わるか</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { value: '2〜3時間', label: 'AI議事録で総会1回あたりの作成時間削減' },
              { value: '数百万円', label: '担当者退職時の引き継ぎコスト削減（1件あたり試算）' },
              { value: '0件', label: '法定点検期限の漏れ（アラート管理による）' },
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-white/10 p-5">
                <p className="text-3xl font-extrabold text-white">{s.value}</p>
                <p className="mt-2 text-sm text-blue-200">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 料金セクション */}
      <section id="pricing" className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-blue-600">Pricing</p>
          <h2 className="mb-4 text-center text-3xl font-bold text-slate-900">料金プラン</h2>
          <p className="mb-12 text-center text-sm text-slate-500">初期3社限定で3ヶ月間完全無料。まずお試しください。</p>
          <div className="grid gap-5 sm:grid-cols-3">
            {PRICING.map((plan) => (
              <div key={plan.name}
                className={`rounded-2xl border p-6 ${plan.highlight ? 'border-blue-500 bg-white shadow-lg shadow-blue-100' : 'border-slate-200 bg-white'}`}>
                {plan.highlight && (
                  <div className="mb-3 inline-flex rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">おすすめ</div>
                )}
                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{plan.desc}</p>
                <div className="my-4">
                  <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                  <span className="text-sm text-slate-500"> {plan.period}</span>
                </div>
                <ul className="mb-6 space-y-2 text-sm text-slate-600">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.ctaHref}
                  className={`block rounded-xl py-3 text-center text-sm font-bold transition ${plan.highlight ? 'bg-blue-600 text-white hover:bg-blue-500' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">まずは無料で試してみてください</h2>
          <p className="mb-8 text-slate-500">
            初期3社限定で3ヶ月間完全無料。クレジットカード不要。
            現役管理会社担当者が設計した、管理会社のための専用SaaSです。
          </p>
          <Link href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-10 py-4 text-base font-bold text-white shadow-lg hover:bg-blue-500">
            無料アカウントを作成する
          </Link>
          <p className="mt-4 text-xs text-slate-400">
            ご不明な点は{' '}
            <a href="mailto:info@kura-app.com" className="text-blue-500 hover:underline">info@kura-app.com</a>
            {' '}までお気軽にご連絡ください。
          </p>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-slate-100 bg-slate-50 px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600">
              <span className="text-xs font-extrabold text-white">K</span>
            </div>
            <span className="font-bold text-slate-700">Kura</span>
          </div>
          <div className="flex gap-5 text-xs text-slate-400">
            <Link href="/privacy" className="hover:text-slate-600">プライバシーポリシー</Link>
            <Link href="/terms" className="hover:text-slate-600">利用規約</Link>
            <Link href="/security" className="hover:text-slate-600">セキュリティ</Link>
            <Link href="/login" className="hover:text-slate-600">ログイン</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
