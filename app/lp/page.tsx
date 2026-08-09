import Link from 'next/link'
import Image from 'next/image'
import KuraLogo from '@/app/components/KuraLogo'
import ContactForm from '@/app/components/ContactForm'
import StickyCtaBar from '@/app/components/StickyCtaBar'
import LpMobileNav from '@/app/components/LpMobileNav'
import HeroEmailForm from '@/app/components/HeroEmailForm'

export const metadata = {
  title: 'Kura — 担当者が辞めても止まらない管理会社へ',
  description: '総会議事録の作成を2時間から50分へ。案件・タスク管理、AI議事録、引き継ぎ書作成を支援する、分譲マンション管理会社向けAI業務管理SaaS。',
  keywords: '分譲マンション管理,管理会社,議事録,AI,属人化,引き継ぎ,タスク管理,SaaS,分譲マンション,管理業務,DX',
  alternates: { canonical: 'https://kura-management.com/lp' },
  openGraph: {
    title: 'Kura — 担当者が辞めても止まらない管理会社へ',
    description: '総会議事録の作成が2時間から50分に。分譲マンション管理会社専用AI業務管理SaaS。',
    url: 'https://kura-management.com/lp',
    siteName: 'Kura',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kura — 担当者が辞めても止まらない管理会社へ',
    description: '総会議事録の作成が2時間から50分に。分譲マンション管理会社専用AI業務管理SaaS。',
  },
}

const PRICING = [
  {
    name: 'スターター',
    price: '¥50,000',
    period: '/ 月（税抜）',
    badge: null,
    sub: '1名あたり月10,000円・棟数無制限',
    features: ['全機能が利用可能', '棟数無制限', 'ユーザー5名まで', 'メールサポート'],
    primary: false,
  },
  {
    name: 'スタンダード',
    price: '¥98,000',
    period: '/ 月（税抜）',
    badge: 'おすすめ',
    sub: '1名あたり月6,534円・棟数無制限',
    features: ['全機能が利用可能', '棟数無制限', 'ユーザー15名まで', 'メール・チャットサポート'],
    primary: true,
  },
  {
    name: 'エンタープライズ',
    price: '要相談',
    period: '',
    badge: null,
    sub: 'ユーザー無制限・棟数無制限',
    features: ['全機能が利用可能', '棟数・ユーザー無制限', '専任サポート担当', 'CSV一括インポート支援', '稟議用セキュリティ資料'],
    primary: false,
  },
]

const FAQ = [
  {
    q: '月額5万円は高くないですか？',
    a: '担当者5名のチームで議事録作成・日次確認を改善した場合の試算例では、月約70時間（時給3,000円換算で月21万円相当）の削減余地があります。スタータープランの月額5万円と比較すると、約4.2倍相当の費用対効果が見込める計算です（※試算条件：月2回議事録作成・月20営業日勤務・時給3,000円）。14日間無料でお試しいただけるので、まず体験してから判断されることをおすすめします。',
  },
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
    a: '最短2分で利用開始できます。会社名・メールアドレスを登録するだけ。IT担当者の対応は不要です。',
  },
  {
    q: '管理している物件数が多くても使えますか？',
    a: 'すべてのプランで棟数は無制限です。50棟・100棟を管理する会社でも追加料金なしでご利用いただけます。料金はご利用人数（担当者数）に応じたプランで決まります。',
  },
  {
    q: '今使っているExcelやメールと干渉しない？',
    a: '既存の業務と並行して使えます。データのCSVエクスポートも可能なので、いつでも元のやり方に戻せます。',
  },
  {
    q: '録音の音質が悪くても大丈夫？',
    a: 'はい。スマートフォンの標準ボイスレコーダーで十分です。多少のノイズや重なり合う発言にも対応しています。',
  },
  {
    q: '途中で解約したい場合は？',
    a: 'マイページから即日解約できます。違約金・手数料は一切ありません。14日間の無料期間中に解約すれば費用も発生しません。',
  },
  {
    q: '電話やオンライン面談は必要ですか？',
    a: '必要ありません。導入前のご質問やご相談は、お問い合わせフォームから受け付けています。内容を確認のうえ、原則3営業日以内にメールで回答します。電話窓口は設けていません。',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Kura',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://kura-management.com/lp',
  description: '分譲マンション管理会社向けAI業務管理SaaS。案件タスク管理・AI議事録・引き継ぎ書自動生成で属人化を解消。',
  offers: [
    { '@type': 'Offer', name: 'スタータープラン', price: '50000', priceCurrency: 'JPY', description: '担当者5名まで・棟数無制限' },
    { '@type': 'Offer', name: 'スタンダードプラン', price: '98000', priceCurrency: 'JPY', description: '担当者15名まで・棟数無制限' },
  ],
  featureList: ['案件・タスク管理', 'AI議事録自動生成', 'AI引き継ぎ書自動生成', '居住者管理', 'CSVデータインポート', 'タスクアラートメール'],
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Kura',
  url: 'https://kura-management.com',
  description: '分譲マンション管理会社向けAI業務管理SaaS',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://kura-management.com/blog?q={search_term_string}' },
    'query-input': 'required name=search_term_string',
  },
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://kura-management.com' },
    { '@type': 'ListItem', position: 2, name: 'サービス紹介', item: 'https://kura-management.com/lp' },
  ],
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Kura',
  url: 'https://kura-management.com',
  logo: 'https://kura-management.com/favicon.ico',
  description: '分譲マンション管理会社向けAI業務管理SaaS。属人化解消・AI議事録・引き継ぎ書自動生成。',
  sameAs: [],
}

export default function LpPage() {
  return (
    <div className="min-h-screen bg-white text-[#1d1d1f] antialiased" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-[rgba(255,255,255,0.85)] backdrop-blur-xl border-b border-[#d2d2d7]/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 h-12">
          <Link href="/" className="flex items-center gap-2">
            <KuraLogo size={22} variant="seal" />
            <span className="text-[17px] font-semibold text-[#1d1d1f] tracking-tight">Kura</span>
          </Link>
          <div className="hidden items-center gap-8 text-[13px] text-[#6e6e73] sm:flex">
            <Link href="/features" className="hover:text-[#1d1d1f] transition-colors">機能</Link>
            <Link href="#how" className="hover:text-[#1d1d1f] transition-colors">使い方</Link>
            <Link href="#pricing" className="hover:text-[#1d1d1f] transition-colors">料金</Link>
            <Link href="#faq" className="hover:text-[#1d1d1f] transition-colors">FAQ</Link>
            <Link href="#contact" className="hover:text-[#1d1d1f] transition-colors">お問い合わせ</Link>
            <Link href="/blog" className="hover:text-[#1d1d1f] transition-colors">ブログ</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-[13px] text-[#0071e3] hover:underline sm:inline">
              ログイン
            </Link>
            <Link href="/signup"
              className="rounded-full bg-[#0071e3] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#0077ed] transition-colors">
              無料で試す
            </Link>
            <LpMobileNav />
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="bg-black text-white">
        <div className="mx-auto max-w-5xl px-6 pb-24 pt-20 text-center lg:pb-32 lg:pt-28">
          <p className="mb-5 text-[13px] font-medium text-[#8e8e93] tracking-widest uppercase">
            分譲マンション管理会社専用 AI
          </p>
          <h1 className="text-[48px] font-bold leading-[1.1] tracking-[-0.025em] text-white lg:text-[68px]">
            理事会・総会の後処理を、<br />
            <span className="bg-gradient-to-r from-[#2997ff] to-[#5e5ce6] bg-clip-text text-transparent">
              2時間から50分へ。
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[18px] leading-relaxed text-[#a1a1a6]">
            音声から自社書式の議事録を作成し、決定事項と宿題を<br />
            案件・タスクへ自動登録。会議後の転記までKuraで終わります。
          </p>
          <HeroEmailForm />
          <p className="mt-4 text-[12px] text-[#636366]">
            導入前のご質問は<Link href="#contact" className="underline underline-offset-2 hover:text-[#8e8e93] transition-colors">お問い合わせフォーム</Link>から受け付けています
          </p>
          <p className="mt-1 text-[11px] text-[#48484a]">
            ※所要時間は、議題数・録音品質・自社フォーマット・確認修正量によって異なります。
          </p>

          {/* ── HERO SCREENSHOT ── */}
          <div className="mx-auto mt-16 max-w-5xl rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)] border border-[#333]">
            <Image
              src="/lp-screenshots/hero.png"
              alt="Kura ダッシュボード — 全物件の案件・タスクをリアルタイム把握"
              width={2560}
              height={1425}
              className="w-full"
              priority
            />
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="bg-[#0071e3] px-6 py-5">
        <div className="mx-auto max-w-5xl flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2.5">
            <svg className="h-5 w-5 text-white/80" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p className="text-[14px] text-white font-medium">現役マンション管理フロント担当者が設計・開発</p>
          </div>
          <div className="flex items-center gap-6 text-[13px] text-white/80">
            <span>✓ 現場の課題から生まれたSaaS</span>
            <span>✓ 14日間無料トライアル受付中</span>
            <span>✓ 導入10分・IT担当者不要</span>
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[13px] font-medium uppercase tracking-widest text-[#6e6e73]">課題</p>
          <h2 className="mt-4 text-[40px] font-bold tracking-[-0.02em] text-[#1d1d1f] leading-tight">
            管理会社が毎年<br />繰り返す、3つの問題。
          </h2>
          <p className="mt-5 text-[17px] text-[#6e6e73] leading-relaxed">
            担当者の退職、議事録作成の負担、法定点検の期限管理。<br className="hidden sm:block" />
            どれも「仕方ない」で片付けてきた問題ですが、解決できます。
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-5xl grid gap-px sm:grid-cols-3 bg-[#d2d2d7] rounded-2xl overflow-hidden">
          {[
            {
              num: '01',
              title: '担当者が辞めると、\n業務が止まる',
              body: '引き継ぎに1〜3ヶ月。対外クレームが多発。前の担当しか知らない情報は永遠に消える。',
            },
            {
              num: '02',
              title: '議事録作成に毎回2時間以上',
              body: '書記のスキルで品質がバラバラ。校正・確認・清書で月に何十時間も消える。',
            },
            {
              num: '03',
              title: 'Excelでの期限管理は限界',
              body: 'エレベーター・消防・貯水槽の期限が各自のファイルに散在。ミス1件で管理組合への賠償リスク。',
            },
          ].map(p => (
            <div key={p.num} className="bg-white p-10">
              <p className="text-[13px] font-semibold text-[#0071e3]">{p.num}</p>
              <h3 className="mt-4 text-[19px] font-semibold text-[#1d1d1f] leading-snug whitespace-pre-line">{p.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[#6e6e73]">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-[#f5f5f7]">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[#d2d2d7]">
            {[
              { num: '50分', label: '総会議事録の作成時間（目安）', note: '従来は約2時間' },
              { num: '0件', label: '法定点検の期限漏れ', note: '自動アラートで管理' },
              { num: '10分', label: '初期設定から利用開始', note: 'IT担当者不要' },
            ].map(s => (
              <div key={s.label} className="text-center px-8">
                <p className="text-[52px] font-bold text-[#1d1d1f] tracking-tight leading-none">{s.num}</p>
                <p className="mt-3 text-[15px] font-medium text-[#1d1d1f]">{s.label}</p>
                <p className="mt-1 text-[13px] text-[#6e6e73]">{s.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features">

        {/* Feature 01 */}
        <div className="bg-[#f5f5f7] px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-[13px] font-semibold text-[#0071e3] uppercase tracking-widest">案件・タスク管理</p>
                <h2 className="mt-4 text-[36px] font-bold tracking-[-0.02em] text-[#1d1d1f] leading-tight">
                  全物件の業務を、<br />一画面で把握する。
                </h2>
                <p className="mt-5 text-[17px] leading-relaxed text-[#6e6e73]">
                  担当者ごとの案件・タスク・期限・進捗をリアルタイムで可視化。管理者が進捗確認のために都度連絡する必要がなくなります。
                </p>
                <ul className="mt-8 space-y-3">
                  {['物件別・担当者別の案件一覧', '期限アラートと優先度管理', '管理費未払いの督促メール', '法定点検スケジュール自動管理'].map(item => (
                    <li key={item} className="flex items-center gap-3 text-[15px] text-[#1d1d1f]">
                      <svg className="h-5 w-5 shrink-0 text-[#0071e3]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="rounded-3xl overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
                  <Image
                    src="/lp-screenshots/feature-tasks.png"
                    alt="案件一覧 — 全物件の案件・期限・進捗を一画面で管理"
                    width={2560}
                    height={1425}
                    className="w-full"
                  />
                </div>
                <p className="mt-3 text-center text-[13px] text-[#6e6e73]">
                  実際の案件、期限、担当者、進捗を物件横断で確認できます。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 02 */}
        <div className="bg-white px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <div className="order-2 lg:order-1">
                <div className="rounded-3xl overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
                  <Image
                    src="/lp-screenshots/feature-minutes.png"
                    alt="AI議事録 生成結果 — 総会議事録を自動生成・編集・タスク抽出"
                    width={2560}
                    height={1425}
                    className="w-full"
                  />
                </div>
                <p className="mt-3 text-center text-[13px] text-[#6e6e73]">
                  音声から議事録の下書きを生成し、決定事項と宿題を整理します。
                </p>
              </div>
              <div className="order-1 lg:order-2">
                <p className="text-[13px] font-semibold text-[#0071e3] uppercase tracking-widest">AI議事録</p>
                <h2 className="mt-4 text-[36px] font-bold tracking-[-0.02em] text-[#1d1d1f] leading-tight">
                  音声を入れるだけ。<br />2時間が50分になる。
                </h2>
                <p className="mt-5 text-[17px] leading-relaxed text-[#6e6e73]">
                  総会・理事会の音声をアップロードするだけで、自社フォーマットの議事録を自動生成。宿題・タスクも自動抽出し、案件管理に直接登録します。
                </p>
                <ul className="mt-8 space-y-3">
                  {['MP3/M4A/WAV対応', '自社フォーマット自動学習・適用', 'タスク自動抽出・案件登録', 'PDF出力・校正・編集に対応'].map(item => (
                    <li key={item} className="flex items-center gap-3 text-[15px] text-[#1d1d1f]">
                      <svg className="h-5 w-5 shrink-0 text-[#0071e3]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[12px] text-[#8e8e93]">
                  ※所要時間は議題数・録音品質・確認修正量によって異なります。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 03 */}
        <div className="bg-[#f5f5f7] px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-[13px] font-semibold text-[#0071e3] uppercase tracking-widest">AI引き継ぎ書</p>
                <h2 className="mt-4 text-[36px] font-bold tracking-[-0.02em] text-[#1d1d1f] leading-tight">
                  物件を選ぶだけ。<br />担当交代が事故らない。
                </h2>
                <p className="mt-5 text-[17px] leading-relaxed text-[#6e6e73]">
                  物件を選択するだけで、案件履歴・特記事項・居住者情報・修繕経緯をAIが整理。担当交代時の情報収集期間を短縮し、着任後の確認漏れを防ぎます。
                </p>
                <ul className="mt-8 space-y-3">
                  {['物件選択だけで自動生成', '特記事項・過去経緯をAIが整理', 'Word/PDF出力', '随時追記・バージョン管理'].map(item => (
                    <li key={item} className="flex items-center gap-3 text-[15px] text-[#1d1d1f]">
                      <svg className="h-5 w-5 shrink-0 text-[#0071e3]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="rounded-3xl overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
                  <Image
                    src="/lp-screenshots/feature-handover.png"
                    alt="AI引き継ぎ書 — 物件を選ぶだけで引き継ぎ書を自動生成"
                    width={2560}
                    height={1425}
                    className="w-full"
                  />
                </div>
                <p className="mt-3 text-center text-[13px] text-[#6e6e73]">
                  物件に蓄積した案件・対応履歴から、引き継ぎ書の下書きを作成します。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 全機能リンク */}
        <div className="bg-[#f5f5f7] px-6 pb-16 text-center">
          <p className="text-[14px] text-[#6e6e73] mb-4">事業計画進捗管理・修繕工事管理・法定点検・クレーム管理・見積比較など、さらに多くの機能を搭載しています。</p>
          <Link href="/features" className="inline-flex items-center gap-2 rounded-full border border-[#0071e3] px-7 py-3 text-[14px] font-medium text-[#0071e3] hover:bg-[#0071e3] hover:text-white transition-colors">
            全機能の詳細を見る →
          </Link>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="bg-black px-6 py-24 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[13px] font-medium uppercase tracking-widest text-[#8e8e93]">How it works</p>
          <h2 className="mt-4 text-[40px] font-bold tracking-[-0.02em] leading-tight">
            たった3ステップ。
          </h2>
          <p className="mt-4 text-[17px] text-[#a1a1a6]">ITに詳しくなくても、当日から使えます。</p>
        </div>
        <div className="mx-auto mt-16 max-w-4xl grid gap-px sm:grid-cols-3 bg-[#2d2d2d] rounded-2xl overflow-hidden">
          {[
            { step: '01', title: '音声をアップロード', desc: 'ICレコーダーやスマートフォンの録音ファイルをそのまま。MP3/M4A/WAV対応。' },
            { step: '02', title: 'AIが自動処理', desc: '文字起こし→議事録生成→タスク抽出まで、自社フォーマットに合わせて自動実行。' },
            { step: '03', title: '議事録＋タスクが完成', desc: '確認・修正してそのままPDF出力。宿題タスクは案件管理に自動登録。' },
          ].map(s => (
            <div key={s.step} className="bg-[#1d1d1f] p-10">
              <p className="text-[32px] font-bold text-[#0071e3]">{s.step}</p>
              <h3 className="mt-4 text-[19px] font-semibold text-white">{s.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[#a1a1a6]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

            {/* ── SECURITY ── */}
      <section className="bg-white px-6 py-16 border-t border-[#e5e5ea]">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <p className="text-[13px] font-semibold text-[#0071e3] uppercase tracking-widest">Security</p>
            <h2 className="mt-3 text-[28px] font-bold tracking-[-0.02em] text-[#1d1d1f]">音声データの取り扱いについて</h2>
            <p className="mt-3 text-[15px] text-[#6e6e73]">理事会・総会の音声には個人名・金額・クレームなど機密情報が含まれます。Kuraの取り扱いを明示します。</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "🔒", title: "通信・保存", body: "すべての通信はTLS暗号化。データはISO 27001認定クラウド（Supabase）に保存します。" },
              { icon: "🤖", title: "AI学習への利用なし", body: "アップロードされた音声・議事録データは、AI・モデルの学習・改善には一切使用しません。" },
              { icon: "🗑️", title: "削除・退会", body: "マイページからいつでも音声データ・アカウントを削除できます。退会後は30日以内に完全消去します。" },
              { icon: "👁️", title: "アクセス管理", body: "データへのアクセスは自社ユーザーのみ。操作ログを記録し、内部監査にも対応します。" },
            ].map(item => (
              <div key={item.title} className="rounded-2xl border border-[#e5e5ea] bg-[#f5f5f7] p-6">
                <div className="text-[28px] mb-3">{item.icon}</div>
                <p className="text-[14px] font-semibold text-[#1d1d1f] mb-2">{item.title}</p>
                <p className="text-[13px] leading-relaxed text-[#6e6e73]">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-[12px] text-[#8e8e93]">稟議用のセキュリティ資料をご希望の場合は<a href="#contact" className="text-[#0071e3] hover:underline">お問い合わせ</a>ください。</p>
        </div>
      </section>

{/* ── FOUNDER STORY ── */}
      <section className="bg-[#f5f5f7] px-6 py-16 border-t border-[#e5e5ea]">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl bg-white p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] sm:p-10">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-[#0071e3]">開発者について</p>
            <h2 className="mt-3 text-[22px] font-bold text-[#1d1d1f] leading-snug">
              なぜ分譲マンション管理会社の<br className="hidden sm:block" />フロントが、このツールを作ったのか。
            </h2>
            <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-[#424245]">
              <p>
                私自身、分譲マンション管理会社でフロント担当として勤務していました。担当棟数は最大で20棟超。毎月の総会・理事会が終わるたびに、深夜まで議事録を清書していました。
              </p>
              <p>
                引き継ぎのたびに膨大な口頭説明、退職したら消える過去の経緯、Excelで追いかける法定点検の期限。「これはツールで解決できる」と気づいたのに、使えるものが市場になかった。だからゼロから作りました。
              </p>
              <p className="font-medium text-[#1d1d1f]">
                Kuraは、管理会社の現場で本当に必要なことだけを詰め込んだツールです。
              </p>
            </div>
            <div className="mt-6 flex items-center gap-4 border-t border-[#e5e5ea] pt-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0071e3] text-white text-[18px] font-bold">K</div>
              <div>
                <p className="text-[14px] font-semibold text-[#1d1d1f]">Kura 開発者</p>
                <p className="text-[13px] text-[#6e6e73]">元・分譲マンション管理会社 フロント担当</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SIGNUP FLOW ── */}
      <section className="bg-white px-6 py-16 border-b border-[#e5e5ea]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[13px] font-semibold text-[#0071e3] uppercase tracking-widest">登録から使い始めるまで</p>
          <h2 className="mt-3 text-[28px] font-bold tracking-[-0.02em] text-[#1d1d1f]">
            2分で登録、すぐに使えます。
          </h2>
          <p className="mt-3 text-[15px] text-[#6e6e73]">IT担当者の対応もシステム設定も不要。メールアドレスだけで今日から使い始められます。</p>
        </div>
        <div className="mx-auto mt-10 max-w-3xl grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { num: '01', title: 'メールと会社名を入力', desc: 'クレジットカード不要。30秒で完了。', time: '約30秒' },
            { num: '02', title: '物件・担当者を登録', desc: 'CSVインポートでまとめて登録できます。', time: '約1〜2分' },
            { num: '03', title: '全機能が使い放題', desc: '14日間、制限なしで全機能をお試しいただけます。', time: 'すぐに開始' },
          ].map(s => (
            <div key={s.num} className="relative rounded-2xl border border-[#e5e5ea] bg-white p-6">
              <span className="absolute -top-3 left-6 rounded-full bg-[#0071e3] px-3 py-0.5 text-[11px] font-semibold text-white">{s.time}</span>
              <p className="text-[13px] font-bold text-[#6e6e73] mt-2">{s.num}</p>
              <h3 className="mt-2 text-[15px] font-semibold text-[#1d1d1f]">{s.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-[#6e6e73]">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/signup"
            className="inline-block rounded-full bg-[#0071e3] px-8 py-3 text-[15px] font-medium text-white hover:bg-[#0077ed] transition-colors">
            今すぐ無料で登録する →
          </Link>
          <p className="mt-3 text-[12px] text-[#6e6e73]">クレジットカード不要・いつでも解約可能</p>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="bg-white px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-[13px] font-medium uppercase tracking-widest text-[#6e6e73]">Pricing</p>
            <h2 className="mt-4 text-[40px] font-bold tracking-[-0.02em] text-[#1d1d1f]">料金プラン</h2>
            <p className="mt-4 text-[17px] text-[#6e6e73]">すべてのプランで棟数は無制限。14日間無料でお試しいただけます。</p>
            <p className="mt-2 text-[13px] text-[#6e6e73]">クレジットカード不要 · 無料期間中はいつでも解約可</p>
          </div>

          {/* ROI Trial Calculation */}
          <div className="mt-12 rounded-2xl bg-white p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-[#e5e5ea]">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[13px] font-semibold uppercase tracking-widest text-[#0071e3]">導入効果（試算例）</p>
              <span className="rounded-full bg-[#f5f5f7] px-2.5 py-0.5 text-[11px] font-medium text-[#6e6e73]">担当者5名の場合</span>
            </div>
            <h3 className="text-[20px] font-bold text-[#1d1d1f]">月約70時間・約21万円相当の削減余地</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-[#f5f5f7] p-5">
                <p className="text-[12px] font-semibold text-[#6e6e73] uppercase tracking-wide">議事録作成</p>
                <p className="mt-2 text-[18px] font-bold text-[#1d1d1f]">2時間 → 50分</p>
                <p className="mt-1 text-[12px] text-[#6e6e73]">（120分−50分）×月2回×5名</p>
                <p className="mt-1 text-[13px] font-semibold text-[#0071e3]">月約11.7時間の削減余地</p>
              </div>
              <div className="rounded-xl bg-[#f5f5f7] p-5">
                <p className="text-[12px] font-semibold text-[#6e6e73] uppercase tracking-wide">日次の案件確認・報告</p>
                <p className="mt-2 text-[18px] font-bold text-[#1d1d1f]">45分 → 10分</p>
                <p className="mt-1 text-[12px] text-[#6e6e73]">（45分−10分）×月20日×5名</p>
                <p className="mt-1 text-[13px] font-semibold text-[#0071e3]">月約58.3時間の削減余地</p>
              </div>
              <div className="rounded-xl bg-[#f5f5f7] p-5">
                <p className="text-[12px] font-semibold text-[#6e6e73] uppercase tracking-wide">AI引き継ぎ書</p>
                <p className="mt-2 text-[15px] font-bold text-[#1d1d1f] leading-snug">担当交代時の情報収集期間を短縮</p>
                <p className="mt-2 text-[12px] text-[#6e6e73]">着任後の確認漏れを防ぐ定性的な効果（月間削減時間の合計には含みません）</p>
              </div>
            </div>
            <div className="mt-6 rounded-xl border border-[#0071e3]/20 bg-[#0071e3]/5 p-5 text-center">
              <p className="text-[14px] text-[#424245]">担当者5名で利用した場合の削減余地（試算例）</p>
              <p className="mt-1 text-[32px] font-bold tracking-tight text-[#1d1d1f]">約70時間 <span className="text-[17px] font-normal text-[#6e6e73]">/ 月</span></p>
              <p className="mt-1 text-[14px] text-[#424245]">時給3,000円換算で <span className="font-semibold text-[#1d1d1f]">月約21万円相当</span> → スタータープラン月額5万円と比較すると <span className="font-semibold text-[#0071e3]">約4.2倍相当</span></p>
            </div>
            <p className="mt-4 text-[11px] text-[#8e8e93] leading-relaxed">
              ※担当者5名、月2回の議事録作成、月20営業日、時給3,000円で計算した試算例です。実際の削減時間や費用対効果は利用状況によって異なり、導入効果を保証するものではありません。
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {PRICING.map(plan => (
              <div key={plan.name}
                className={`relative rounded-2xl bg-white p-8 ${plan.primary ? 'ring-2 ring-[#0071e3] shadow-[0_4px_24px_rgba(0,113,227,0.15)]' : 'shadow-[0_2px_16px_rgba(0,0,0,0.06)]'}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0071e3] px-4 py-0.5 text-[12px] font-medium text-white">
                    {plan.badge}
                  </div>
                )}
                <h3 className="text-[17px] font-semibold text-[#1d1d1f]">{plan.name}</h3>
                <p className="mt-0.5 text-[13px] text-[#6e6e73]">{plan.sub}</p>
                <div className="my-6 border-t border-[#e5e5ea] pt-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[34px] font-bold tracking-tight text-[#1d1d1f]">{plan.price}</span>
                    <span className="text-[13px] text-[#6e6e73]">{plan.period}</span>
                  </div>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-[15px] text-[#1d1d1f]">
                      <svg className="h-4 w-4 shrink-0 text-[#0071e3]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.name === 'エンタープライズ' ? '#contact' : '/signup'}
                  className={`block rounded-full py-2.5 text-center text-[15px] font-medium transition-colors ${plan.primary ? 'bg-[#0071e3] text-white hover:bg-[#0077ed]' : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e5e5ea]'}`}>
                  {plan.name === 'エンタープライズ' ? 'お問い合わせ' : '14日間無料で試す'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-[#f5f5f7] px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <p className="text-[13px] font-medium uppercase tracking-widest text-[#6e6e73]">FAQ</p>
            <h2 className="mt-4 text-[40px] font-bold tracking-[-0.02em] text-[#1d1d1f]">よくある質問</h2>
            <p className="mt-4 text-[17px] text-[#6e6e73]">導入前の疑問にすべてお答えします。</p>
          </div>
          <div className="mt-14 divide-y divide-[#d2d2d7]">
            {FAQ.map(item => (
              <div key={item.q} className="py-6">
                <p className="text-[17px] font-semibold text-[#1d1d1f]">{item.q}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-[#6e6e73]">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-black px-6 py-24 text-white text-center">
        <div className="mx-auto max-w-2xl">
          <p className="text-[13px] font-medium uppercase tracking-widest text-[#8e8e93]">まずは無料で</p>
          <h2 className="mt-4 text-[28px] sm:text-[36px] lg:text-[40px] font-bold tracking-[-0.02em] leading-tight whitespace-nowrap">
            14日間、全機能を試してみてください。
          </h2>
          <p className="mt-5 text-[17px] leading-relaxed text-[#a1a1a6]">
            議事録1本を実際にAIで作ってみると、<br className="hidden sm:block" />「これは使える」か「うちには合わない」かがすぐわかります。
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/signup"
              className="rounded-full bg-[#0071e3] px-10 py-4 text-[18px] font-medium text-white hover:bg-[#0077ed] transition-colors shadow-[0_0_32px_rgba(0,113,227,0.4)]">
              今すぐ無料で始める →
            </Link>
            <Link href="#contact"
              className="rounded-full border border-[#424245] px-10 py-4 text-[18px] font-medium text-white hover:border-[#6e6e73] transition-colors">
              導入前に質問する
            </Link>
          </div>
          <p className="mt-5 text-[13px] text-[#8e8e93]">クレジットカード不要 · 登録2分 · いつでも解約</p>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="bg-[#f5f5f7] px-6 py-24">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <p className="text-[13px] font-medium uppercase tracking-widest text-[#6e6e73]">Contact</p>
            <h2 className="mt-4 text-[40px] font-bold tracking-[-0.02em] text-[#1d1d1f]">お問い合わせ</h2>
            <p className="mt-4 text-[16px] text-[#424245] leading-relaxed">
              導入前のご質問、料金、機能、運用方法について、<br className="hidden sm:block" />お問い合わせフォームから受け付けています。<br />
              内容を確認のうえ、原則3営業日以内にメールで回答します。
            </p>
            <div className="mt-5 grid grid-cols-1 gap-2 text-[13px] sm:grid-cols-2">
              {[
                '導入前の質問だけでも送信可能',
                '24時間フォームから受付',
                '原則3営業日以内に回答',
                '回答はメールで送付',
              ].map(item => (
                <div key={item} className="flex items-center justify-center gap-1.5 text-[#424245]">
                  <svg className="h-4 w-4 shrink-0 text-[#0071e3]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-4 text-[13px] text-[#6e6e73]">
              お問い合わせ内容を正確に記録し、確実に回答するため、ご相談はフォームにて承っています。
            </p>
          </div>
          <div className="mt-10 rounded-2xl bg-white p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#f5f5f7] border-t border-[#d2d2d7] px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <KuraLogo size={20} variant="seal" />
              <span className="text-[15px] font-semibold text-[#1d1d1f]">Kura</span>
            </div>
            <div className="flex flex-wrap gap-6 text-[13px] text-[#6e6e73]">
              <Link href="/privacy" className="hover:text-[#1d1d1f] transition-colors">プライバシーポリシー</Link>
              <Link href="/terms" className="hover:text-[#1d1d1f] transition-colors">利用規約</Link>
              <Link href="/security" className="hover:text-[#1d1d1f] transition-colors">セキュリティ</Link>
              <Link href="/login" className="hover:text-[#1d1d1f] transition-colors">ログイン</Link>
            </div>
          </div>
          <p className="mt-8 text-[13px] text-[#6e6e73]">Copyright © 2024 Kura. All rights reserved.</p>
        </div>
      </footer>

      <StickyCtaBar />
    </div>
  )
}
