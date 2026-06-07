import Link from 'next/link'
import KuraLogo from '@/app/components/KuraLogo'
import ContactForm from '@/app/components/ContactForm'

export const metadata = {
  title: 'Kura — 担当者が辞めても止まらない管理会社へ',
  description: '分譲マンション管理会社向けAI業務管理SaaS。総会議事録を2時間→50分に。案件タスク管理・AI議事録・引き継ぎ書自動生成で属人化を解消。',
}

const PRICING = [
  {
    name: 'トライアル',
    price: '無料',
    period: '3ヶ月間',
    badge: null,
    sub: '初期3社限定',
    features: ['全機能が利用可能', '物件数無制限', 'ユーザー3名まで', 'メールサポート'],
    primary: false,
  },
  {
    name: 'スタンダード',
    price: '¥30,000',
    period: '/ 月（税抜）',
    badge: 'おすすめ',
    sub: '中小管理会社向け',
    features: ['全機能が利用可能', '物件数無制限', 'ユーザー10名まで', 'メール・チャットサポート'],
    primary: true,
  },
  {
    name: 'プロ',
    price: '¥50,000',
    period: '/ 月（税抜）',
    badge: null,
    sub: '中堅管理会社向け',
    features: ['全機能が利用可能', '物件数・ユーザー無制限', '専任サポート担当', 'CSV一括インポート支援', '稟議用セキュリティ資料'],
    primary: false,
  },
]

const FAQ = [
  {
    q: 'どんな音声フォーマットに対応していますか？',
    a: 'MP3 / M4A / WAV / OGGに対応しています。ICレコーダー・スマートフォンの録音アプリからそのまま使えます。',
  },
  {
    q: '自社フォーマットで議事録を出力できますか？',
    a: 'はい。御社の既存フォーマット（Word・Excel等）をアップロードすると、AIが文体・項目構成・表現を学習し、次回から自動適用します。',
  },
  {
    q: 'セキュリティは大丈夫ですか？',
    a: '通信はすべてTLS暗号化。データはISO27001認定のクラウド基盤（Supabase）に保存。アクセスログも記録します。稟議用のセキュリティ資料をご用意しています。',
  },
  {
    q: '導入・設定にどのくらい時間がかかりますか？',
    a: '最短10分で利用開始できます。会社名・メールアドレスを登録し、音声ファイルをアップロードするだけ。IT担当者の対応は不要です。',
  },
  {
    q: '管理している物件数が多くても使えますか？',
    a: 'すべてのプランで物件数は無制限です。50物件・100物件管理会社でも追加料金なしでご利用いただけます。',
  },
]

export default function LpPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">

      {/* ━━━━━ NAV ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <KuraLogo size={32} variant="seal" />
            <span className="text-lg font-extrabold text-slate-900 tracking-tight">Kura</span>
          </Link>
          <div className="hidden items-center gap-7 text-sm font-medium text-slate-500 sm:flex">
            <Link href="#how" className="hover:text-slate-900 transition-colors">使い方</Link>
            <Link href="#features" className="hover:text-slate-900 transition-colors">機能</Link>
            <Link href="#pricing" className="hover:text-slate-900 transition-colors">料金</Link>
            <Link href="#faq" className="hover:text-slate-900 transition-colors">FAQ</Link>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/login" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:inline transition-colors">
              ログイン
            </Link>
            <Link href="#contact"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-500 transition-colors">
              デモを申し込む
            </Link>
          </div>
        </div>
      </nav>

      {/* ━━━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative overflow-hidden bg-[#070E1C]">

        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-600 opacity-[0.06] blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-indigo-600 opacity-[0.04] blur-[80px]" />
          <svg className="absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-20 lg:pt-24">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">

            <div className="flex-1 lg:max-w-[520px]">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs font-semibold text-blue-300">分譲マンション管理会社専用 AI</span>
              </div>

              <h1 className="text-5xl font-extrabold leading-[1.12] tracking-tight text-white lg:text-6xl">
                総会議事録が、<br />
                <span className="text-blue-400">50分</span>になった。
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-400">
                音声をアップロードするだけ。<br />
                自社フォーマットで、議事録を自動生成。<br />
                宿題・タスクまで自動抽出します。
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="#contact"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-400 transition-colors">
                  デモを申し込む
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link href="/promo"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  動画を見る（54秒）
                </Link>
              </div>

              <p className="mt-4 text-xs text-slate-600">
                初期3社限定 · 3ヶ月間完全無料 · クレジットカード不要
              </p>

              <div className="mt-8 flex flex-wrap gap-5">
                {['TLS暗号化通信', '現役フロントマンが設計', '最短10分で導入'].map(text => (
                  <div key={text} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="h-1 w-1 rounded-full bg-slate-500" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* プロダクトモックアップ */}
            <div className="w-full lg:w-[440px] lg:shrink-0">
              <div className="relative rounded-2xl border border-white/10 bg-[#0D1B2E] shadow-2xl shadow-black/50 overflow-hidden">
                <div className="flex items-center gap-1.5 border-b border-white/5 bg-black/20 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F]" />
                  <div className="ml-3 flex-1 rounded-md bg-white/5 px-3 py-1 text-[10px] text-white/20">
                    kura-management.com/ai-minutes
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <KuraLogo size={20} variant="seal" />
                    <span className="text-xs font-bold text-white">AI議事録</span>
                    <span className="ml-auto rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-semibold text-green-400">
                      完了
                    </span>
                  </div>

                  <div className="rounded-xl bg-white p-4 shadow-lg">
                    <div className="mb-3 border-b border-slate-100 pb-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        第12回 定期総会 議事録
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-slate-800">2024年6月7日（金）</p>
                      <p className="text-[10px] text-slate-400">マンション名：グランドパレス××</p>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      {[92, 77, 84, 68, 91].map((w, i) => (
                        <div key={i} className="h-1.5 rounded-full bg-slate-100" style={{ width: `${w}%` }} />
                      ))}
                    </div>

                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-2.5">
                      <p className="mb-1.5 text-[9px] font-bold text-blue-700">
                        宿題・タスク（AI自動抽出）
                      </p>
                      <div className="space-y-1">
                        {[
                          '修繕積立金の見直し案を作成',
                          '消防設備点検の日程調整',
                          '駐車場規約の改訂案提示',
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                            <p className="text-[9px] text-slate-600">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <svg className="h-3.5 w-3.5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-[11px] text-slate-400">生成時間</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-extrabold text-white">50分</span>
                      <span className="text-[10px] text-slate-500 line-through">2時間</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-center text-xs text-slate-600">
                実際の画面イメージ。音声アップロード→議事録完成まで。
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ━━━━━ STATS BAR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { num: '50分', sub: '総会議事録1回あたり（従来2時間）', accent: 'text-blue-600' },
              { num: '0件', sub: '法定点検期限の漏れ（自動アラートで）', accent: 'text-emerald-600' },
              { num: '10分', sub: '初期設定から利用開始まで', accent: 'text-purple-600' },
            ].map(s => (
              <div key={s.sub}>
                <p className={`text-3xl font-extrabold sm:text-4xl ${s.accent}`}>{s.num}</p>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━ PROBLEM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-red-500">Problem</p>
          <h2 className="mb-3 text-center text-3xl font-extrabold text-slate-900">
            あなたの会社でも、起きていませんか
          </h2>
          <p className="mb-12 text-center text-sm text-slate-500">管理会社が毎年繰り返す、3つの重大課題</p>

          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                tag: '課題 1',
                title: '担当者が退職するたびに業務が止まる',
                body: '引き継ぎに1〜3ヶ月、対外クレームが多発。「前の担当しか知らない」情報は永遠に失われる。',
                accent: 'border-red-200 bg-red-50',
                tagColor: 'text-red-600 bg-red-100',
              },
              {
                tag: '課題 2',
                title: '総会議事録の作成に毎回2時間以上',
                body: '書記担当のスキルで品質がバラバラ。校正・確認・清書で月に何十時間も消える。',
                accent: 'border-orange-200 bg-orange-50',
                tagColor: 'text-orange-600 bg-orange-100',
              },
              {
                tag: '課題 3',
                title: '法定点検の期限がExcelで限界',
                body: 'エレベーター・消防・貯水槽の期限が担当者のファイルに散在。ミス1件で管理組合への賠償リスク。',
                accent: 'border-yellow-200 bg-yellow-50',
                tagColor: 'text-yellow-700 bg-yellow-100',
              },
            ].map(p => (
              <div key={p.tag} className={`rounded-2xl border p-6 ${p.accent}`}>
                <span className={`mb-3 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${p.tagColor}`}>
                  {p.tag}
                </span>
                <h3 className="mb-2 text-base font-bold text-slate-800">{p.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━ HOW IT WORKS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="how" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-blue-600">How it works</p>
          <h2 className="mb-3 text-center text-3xl font-extrabold text-slate-900">たった3ステップ</h2>
          <p className="mb-14 text-center text-sm text-slate-500">ITに詳しくなくても、当日から使えます</p>

          <div className="relative grid gap-8 sm:grid-cols-3">
            <div className="absolute left-[calc(16.6%+16px)] top-8 hidden h-0.5 bg-gradient-to-r from-blue-200 to-blue-200 sm:block" style={{ width: 'calc(66.7% - 32px)' }} />

            {[
              {
                step: '01',
                icon: (
                  <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                ),
                title: '音声をアップロード',
                desc: 'ICレコーダーやスマートフォンの録音ファイルをそのまま。対応形式：MP3/M4A/WAV',
              },
              {
                step: '02',
                icon: (
                  <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                title: 'AIが自動処理',
                desc: '文字起こし→議事録生成→タスク抽出まで、自社フォーマットに合わせて自動実行',
              },
              {
                step: '03',
                icon: (
                  <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.707l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: '議事録＋タスクが完成',
                desc: '確認・修正してそのままPDF出力。宿題タスクは案件管理に自動登録',
              },
            ].map(s => (
              <div key={s.step} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 shadow-sm">
                  {s.icon}
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                    {s.step}
                  </span>
                </div>
                <h3 className="mb-2 font-bold text-slate-900">{s.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━ BEFORE / AFTER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <p className="mb-8 text-center text-xs font-bold uppercase tracking-widest text-blue-600">Before / After</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-red-200 bg-white p-6">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-red-400">Kura 導入前</p>
              <div className="space-y-3">
                {[
                  '総会が終わってから2時間、議事録作成',
                  '担当者のExcelで法定点検を管理',
                  '退職のたびに1〜3ヶ月の引き継ぎ作業',
                  '書記のスキルで議事録の質がバラバラ',
                  '「あの件どうなった？」の問い合わせが多発',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <p className="text-sm text-slate-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-6">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-emerald-500">Kura 導入後</p>
              <div className="space-y-3">
                {[
                  '音声をアップロード、50分で議事録完成',
                  '法定点検の期限は自動アラートで管理',
                  '引き継ぎ書は物件選択だけで自動生成',
                  '自社フォーマットで毎回一定品質',
                  '全担当者の案件状況をリアルタイム確認',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <p className="text-sm text-slate-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━ FEATURES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="features" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-blue-600">Features</p>
          <h2 className="mb-3 text-center text-3xl font-extrabold text-slate-900">Kuraの3本柱</h2>
          <p className="mb-14 text-center text-sm text-slate-500">管理会社の属人化をゼロにする、核心機能</p>

          <div className="space-y-5">
            {[
              {
                num: '01',
                tag: '案件・タスク管理',
                title: '全物件の業務を、一画面で把握する',
                desc: '担当者ごとの案件・タスク・期限・進捗をリアルタイムで可視化。「誰が何をいつまでにやるか」が常に明確になり、管理者が進捗確認のために都度連絡する必要がなくなります。法定点検・修繕・管理費督促もすべて一元管理。',
                items: ['物件別・担当者別の案件一覧', '期限アラートと優先度管理', '管理費未払いの督促メール送信', '法定点検スケジュール自動アラート'],
                color: 'border-blue-100 bg-blue-50/50',
                numColor: 'text-blue-600',
              },
              {
                num: '02',
                tag: 'AI議事録',
                title: '音声を入れるだけ。2時間が50分になる。',
                desc: '総会・理事会の音声をアップロードするだけで、議事録を自動生成。御社の既存フォーマット・文体をAIが学習し、次回から自動適用します。宿題・タスクも自動抽出され、そのまま案件管理に登録。',
                items: ['MP3/M4A/WAV対応', '自社フォーマット学習（自動適用）', 'タスク自動抽出・案件登録', 'PDF出力・校正・編集に対応'],
                color: 'border-purple-100 bg-purple-50/50',
                numColor: 'text-purple-600',
              },
              {
                num: '03',
                tag: 'AI引き継ぎ書',
                title: '物件を選ぶだけ。担当交代が事故らない。',
                desc: '物件を選択するだけで、案件履歴・特記事項・居住者情報・修繕経緯をAIが整理した引き継ぎ書を自動生成。担当交代のコストを最小化し、「前の担当者しか知らない」情報の蒸発を防ぎます。',
                items: ['物件選択だけで自動生成', '特記事項・過去経緯をAIが整理', 'Word/PDF出力', '随時追記・バージョン管理'],
                color: 'border-emerald-100 bg-emerald-50/50',
                numColor: 'text-emerald-600',
              },
            ].map(f => (
              <div key={f.num} className={`rounded-2xl border p-7 ${f.color}`}>
                <div className="flex flex-col gap-6 sm:flex-row">
                  <div className="sm:w-10">
                    <span className={`text-4xl font-black ${f.numColor} opacity-25`}>{f.num}</span>
                  </div>
                  <div className="flex-1">
                    <span className="mb-2 inline-block rounded-full bg-white px-3 py-0.5 text-xs font-bold text-slate-700 shadow-sm">
                      {f.tag}
                    </span>
                    <h3 className="mb-3 text-xl font-extrabold text-slate-900">{f.title}</h3>
                    <p className="mb-4 text-sm leading-7 text-slate-600">{f.desc}</p>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {f.items.map(item => (
                        <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                          <span className="text-blue-400">›</span>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━ ROI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative overflow-hidden bg-[#070E1C] px-6 py-20 text-white">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-700 opacity-[0.06] blur-[80px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-400">実測データ</p>
          <p className="mb-3 text-base text-slate-400">総会議事録1回あたりの作成時間</p>
          <div className="flex items-center justify-center gap-5 py-4">
            <div className="text-center">
              <p className="text-6xl font-black text-slate-500 line-through sm:text-7xl">2時間</p>
              <p className="mt-1 text-xs text-slate-600">従来の作業時間</p>
            </div>
            <svg className="h-8 w-8 shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
            <div className="text-center">
              <p className="text-6xl font-black text-blue-400 sm:text-7xl">50分</p>
              <p className="mt-1 text-xs text-slate-400">Kura使用時</p>
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            月2回の総会・理事会があれば、月あたり<span className="font-bold text-white">3時間20分</span>を節約。<br />
            担当者が10名なら年間で<span className="font-bold text-white">400時間以上</span>。
          </p>
          <Link href="#contact"
            className="mt-10 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-400 transition-colors">
            デモを申し込む
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ━━━━━ PRICING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="pricing" className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-blue-600">Pricing</p>
          <h2 className="mb-3 text-center text-3xl font-extrabold text-slate-900">料金プラン</h2>
          <p className="mb-12 text-center text-sm text-slate-500">
            初期3社限定で3ヶ月間完全無料。実際に使って判断してください。
          </p>

          <div className="grid gap-5 sm:grid-cols-3">
            {PRICING.map(plan => (
              <div key={plan.name}
                className={`relative rounded-2xl border bg-white p-7 ${plan.primary ? 'border-blue-500 shadow-xl shadow-blue-100 ring-1 ring-blue-500/30' : 'border-slate-200 shadow-sm'}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 px-4 py-0.5 text-xs font-bold text-white">
                    {plan.badge}
                  </div>
                )}
                <h3 className="text-base font-extrabold text-slate-900">{plan.name}</h3>
                <p className="mt-0.5 text-xs text-slate-400">{plan.sub}</p>
                <div className="my-5 border-t border-slate-100 pt-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                    <span className="text-sm text-slate-400">{plan.period}</span>
                  </div>
                </div>
                <ul className="mb-6 space-y-2.5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="#contact"
                  className={`block rounded-xl py-3 text-center text-sm font-bold transition-colors ${plan.primary ? 'bg-blue-600 text-white hover:bg-blue-500' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                  デモを申し込む
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            すべてのプランで物件数は無制限。月途中からでも利用開始できます。
          </p>
        </div>
      </section>

      {/* ━━━━━ FAQ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="faq" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-blue-600">FAQ</p>
          <h2 className="mb-10 text-center text-3xl font-extrabold text-slate-900">よくあるご質問</h2>

          <div className="divide-y divide-slate-100">
            {FAQ.map(item => (
              <div key={item.q} className="py-5">
                <p className="mb-2 font-bold text-slate-900">Q. {item.q}</p>
                <p className="text-sm leading-7 text-slate-500">A. {item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━ CONTACT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="contact" className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-xl">
          <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-blue-600">Contact</p>
          <h2 className="mb-3 text-center text-3xl font-extrabold text-slate-900">デモ・お問い合わせ</h2>
          <p className="mb-10 text-center text-sm text-slate-500">
            30分のオンラインデモで、貴社の業務への活用イメージをお見せします。<br />
            初期3社限定で3ヶ月間完全無料でご利用いただけます。
          </p>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ━━━━━ FOOTER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="bg-[#040A13] px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <KuraLogo size={28} variant="seal" />
            <span className="font-extrabold text-white">Kura</span>
            <span className="text-xs text-slate-600">管理会社専用AI</span>
          </div>
          <div className="flex flex-wrap gap-5 text-xs text-slate-600">
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">プライバシーポリシー</Link>
            <Link href="/terms" className="hover:text-slate-400 transition-colors">利用規約</Link>
            <Link href="/security" className="hover:text-slate-400 transition-colors">セキュリティ</Link>
            <Link href="/login" className="hover:text-slate-400 transition-colors">ログイン</Link>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-800">
          © 2024 Kura. All rights reserved.
        </p>
      </footer>

    </div>
  )
}
