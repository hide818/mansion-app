import Link from 'next/link'
import KuraLogo from '@/app/components/KuraLogo'
import ContactForm from '@/app/components/ContactForm'

export const metadata = {
  title: 'Kura — 担当者が辞めても止まらない管理会社へ',
  description: '分譲マンション管理会社向けAI業務管理SaaS。総会議事録を2時間→50分に。案件タスク管理・AI議事録・引き継ぎ書自動生成で属人化を解消。月額¥50,000〜・棟数無制限。',
  keywords: '分譲マンション管理,管理会社,議事録,AI,属人化,引き継ぎ,タスク管理,SaaS,分譲マンション,管理業務,DX',
  alternates: { canonical: 'https://kura-management.com/lp' },
  openGraph: {
    title: 'Kura — 担当者が辞めても止まらない管理会社へ',
    description: '総会議事録が2時間→50分に。分譲マンション管理会社専用AI業務管理SaaS。',
    url: 'https://kura-management.com/lp',
    siteName: 'Kura',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kura — 担当者が辞めても止まらない管理会社へ',
    description: '総会議事録が2時間→50分に。分譲マンション管理会社専用AI業務管理SaaS。',
  },
}

const PRICING = [
  {
    name: 'スターター',
    price: '¥50,000',
    period: '/ 月（税抜）',
    badge: null,
    sub: '担当者5名まで・棟数無制限',
    features: ['全機能が利用可能', '棟数無制限', 'ユーザー5名まで', 'メールサポート'],
    primary: false,
  },
  {
    name: 'スタンダード',
    price: '¥98,000',
    period: '/ 月（税抜）',
    badge: 'おすすめ',
    sub: '担当者15名まで・棟数無制限',
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
    a: 'すべてのプランで棟数は無制限です。50棟・100棟を管理する会社でも追加料金なしでご利用いただけます。料金はご利用人数（担当者数）に応じたプランで決まります。',
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

export default function LpPage() {
  return (
    <div className="min-h-screen bg-white text-[#1d1d1f] antialiased" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-[rgba(255,255,255,0.85)] backdrop-blur-xl border-b border-[#d2d2d7]/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 h-12">
          <Link href="/" className="flex items-center gap-2">
            <KuraLogo size={22} variant="seal" />
            <span className="text-[17px] font-semibold text-[#1d1d1f] tracking-tight">Kura</span>
          </Link>
          <div className="hidden items-center gap-8 text-[13px] text-[#6e6e73] sm:flex">
            <Link href="#features" className="hover:text-[#1d1d1f] transition-colors">機能</Link>
            <Link href="#how" className="hover:text-[#1d1d1f] transition-colors">使い方</Link>
            <Link href="#pricing" className="hover:text-[#1d1d1f] transition-colors">料金</Link>
            <Link href="#faq" className="hover:text-[#1d1d1f] transition-colors">FAQ</Link>
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
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="bg-black text-white">
        <div className="mx-auto max-w-5xl px-6 pb-24 pt-20 text-center lg:pb-32 lg:pt-28">
          <p className="mb-5 text-[13px] font-medium text-[#6e6e73] tracking-widest uppercase">
            分譲マンション管理会社専用 AI
          </p>
          <h1 className="text-[56px] font-bold leading-[1.07] tracking-[-0.025em] text-white lg:text-[72px]">
            総会議事録が、<br />
            <span className="bg-gradient-to-r from-[#2997ff] to-[#5e5ce6] bg-clip-text text-transparent">
              50分
            </span>
            になった。
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[19px] leading-relaxed text-[#a1a1a6]">
            音声をアップロードするだけ。自社フォーマットで議事録を自動生成。<br />宿題・タスクまで自動抽出。
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/signup"
              className="rounded-full bg-[#0071e3] px-8 py-3.5 text-[17px] font-medium text-white hover:bg-[#0077ed] transition-colors">
              14日間無料で試す
            </Link>
          </div>
          <p className="mt-5 text-[13px] text-[#424245]">メールアドレスのみで登録 · 30秒で開始 · クレジットカード不要</p>

          {/* ── HERO UI MOCK ── */}
          <div className="mx-auto mt-16 max-w-3xl rounded-2xl overflow-hidden border border-[#333] shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-1.5 bg-[#1a1a1a] px-4 py-3 border-b border-[#333]">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28ca41]" />
              <span className="ml-4 text-[12px] text-[#666]">app.kura-management.com — 全物件 案件一覧</span>
            </div>
            <div className="bg-[#111] p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-white">今日の対応が必要な案件</p>
                <span className="rounded-full bg-red-500/20 px-3 py-0.5 text-[11px] font-medium text-red-300">期限超過 2件</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { name: 'グランドパレス丸の内｜修繕積立金見直し', due: '今日', status: '対応中', badge: 'bg-blue-500/20 text-blue-300' },
                  { name: 'ライオンズ品川｜消防設備点検', due: '昨日', status: '期限超過', badge: 'bg-red-500/20 text-red-300' },
                  { name: 'パークヒルズ渋谷｜総会議事録', due: '7/18', status: '完了', badge: 'bg-green-500/20 text-green-300' },
                  { name: 'コスモ新宿｜引き継ぎ書作成', due: '7/20', status: '対応中', badge: 'bg-blue-500/20 text-blue-300' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                    <div>
                      <p className="text-[13px] font-medium text-white">{item.name}</p>
                      <p className="text-[11px] text-[#555]">期限：{item.due}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${item.badge}`}>{item.status}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-[#0071e3]/10 border border-[#0071e3]/30 p-4">
                <p className="text-[12px] text-[#2997ff]">🤖 AI議事録が完成しました — パークヒルズ渋谷 第12回理事会（所要時間：48分）</p>
              </div>
            </div>
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

      {/* ── STATS ── */}
      <section className="bg-[#f5f5f7]">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[#d2d2d7]">
            {[
              { num: '50分', label: '総会議事録1回あたり', note: '従来は2時間' },
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
          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#fff3cd] px-5 py-2.5 text-[14px] text-[#856404]">
            <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
            担当者1人あたり平均20棟以上を担当。退職・引き継ぎのコストは経営課題の上位です。
          </div>
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
              <div className="rounded-3xl bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
                <div className="space-y-3">
                  {[
                    { name: 'グランドパレス××｜修繕積立金見直し', due: '6/15', status: '対応中', color: 'bg-blue-100 text-blue-700' },
                    { name: 'ライオンズ△△｜消防設備点検', due: '6/20', status: '未対応', color: 'bg-red-100 text-red-700' },
                    { name: 'パークヒルズ□□｜管理費督促', due: '6/18', status: '完了', color: 'bg-green-100 text-green-700' },
                    { name: 'コスモ◎◎｜引き継ぎ書作成', due: '6/25', status: '対応中', color: 'bg-blue-100 text-blue-700' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-[#f5f5f7] px-4 py-3">
                      <div>
                        <p className="text-[13px] font-medium text-[#1d1d1f]">{item.name}</p>
                        <p className="text-[11px] text-[#6e6e73]">期限 {item.due}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${item.color}`}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 02 */}
        <div className="bg-white px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <div className="order-2 lg:order-1 rounded-3xl bg-[#f5f5f7] p-8">
                <div className="rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-[#1d1d1f]">第12回 定期総会 議事録</p>
                    <span className="rounded-full bg-[#d1fae5] px-2.5 py-0.5 text-[11px] font-medium text-[#065f46]">生成完了</span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {[88, 72, 95, 63, 80].map((w, i) => (
                      <div key={i} className="h-1.5 rounded-full bg-[#e5e5ea]" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                  <div className="rounded-xl bg-[#f0f9ff] border border-[#bae6fd] p-3">
                    <p className="mb-2 text-[11px] font-semibold text-[#0369a1]">AI自動抽出 · 宿題タスク</p>
                    {['修繕積立金の見直し案を作成', '消防設備点検の日程調整', '駐車場規約の改訂案提示'].map((t, i) => (
                      <div key={i} className="flex items-center gap-2 mt-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#0071e3] shrink-0" />
                        <p className="text-[11px] text-[#374151]">{t}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f5f5f7] px-3 py-2.5">
                    <p className="text-[12px] text-[#6e6e73]">作成時間</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[20px] font-bold text-[#1d1d1f]">50分</span>
                      <span className="text-[11px] text-[#6e6e73] line-through">2時間</span>
                    </div>
                  </div>
                </div>
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
                  物件を選択するだけで、案件履歴・特記事項・居住者情報・修繕経緯をAIが整理。担当交代のコストを最小化し、情報の蒸発を防ぎます。
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
              <div className="rounded-3xl bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
                <p className="text-[13px] font-semibold text-[#1d1d1f] mb-5">引き継ぎ書 — グランドパレス××号室</p>
                {[
                  { label: '担当変更履歴', value: '3回（直近：2024年3月）' },
                  { label: '管理組合の特記事項', value: '駐車場トラブル多発 · 修繕委員会設置中' },
                  { label: '進行中の案件', value: '修繕積立金改定 · 消防設備更新' },
                  { label: '重要居住者情報', value: '理事長：山田様（連絡先登録済）' },
                ].map((row, i) => (
                  <div key={i} className={`flex gap-4 py-3.5 ${i < 3 ? 'border-b border-[#e5e5ea]' : ''}`}>
                    <p className="w-36 shrink-0 text-[12px] text-[#6e6e73]">{row.label}</p>
                    <p className="text-[13px] font-medium text-[#1d1d1f]">{row.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="bg-black px-6 py-24 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[13px] font-medium uppercase tracking-widest text-[#6e6e73]">How it works</p>
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
              <p className="text-[32px] font-bold text-[#2d2d2d]">{s.step}</p>
              <h3 className="mt-4 text-[19px] font-semibold text-white">{s.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[#6e6e73]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROI ── */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[13px] font-medium uppercase tracking-widest text-[#6e6e73]">削減効果の目安</p>
          <h2 className="mt-4 text-[40px] font-bold tracking-[-0.02em] text-[#1d1d1f]">
            時間を、取り戻す。
          </h2>
          <div className="mt-14 flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-[64px] font-bold text-[#6e6e73] line-through tracking-tight leading-none">2時間</p>
              <p className="mt-3 text-[13px] text-[#6e6e73]">従来の議事録作成時間</p>
            </div>
            <svg className="h-8 w-8 shrink-0 text-[#0071e3]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
            <div className="text-center">
              <p className="text-[64px] font-bold text-[#1d1d1f] tracking-tight leading-none">50分</p>
              <p className="mt-3 text-[13px] text-[#6e6e73]">Kura使用時</p>
            </div>
          </div>
          <p className="mt-10 text-[17px] text-[#6e6e73] leading-relaxed">
            月2回の総会・理事会があれば、月あたり<span className="font-semibold text-[#1d1d1f]">3時間20分</span>を節約。<br />
            担当者が10名なら年間で<span className="font-semibold text-[#1d1d1f]">400時間以上</span>を取り戻せます。
          </p>
          <Link href="/signup"
            className="mt-10 inline-flex rounded-full bg-[#0071e3] px-8 py-3.5 text-[17px] font-medium text-white hover:bg-[#0077ed] transition-colors">
            14日間無料で試す
          </Link>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="bg-[#f5f5f7] px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-[13px] font-medium uppercase tracking-widest text-[#6e6e73]">Pricing</p>
            <h2 className="mt-4 text-[40px] font-bold tracking-[-0.02em] text-[#1d1d1f]">料金プラン</h2>
            <p className="mt-4 text-[17px] text-[#6e6e73]">すべてのプランで棟数は無制限。14日間無料でお試しいただけます。</p>
            <p className="mt-2 text-[13px] text-[#6e6e73]">クレジットカード不要 · 無料期間中はいつでも解約可</p>
          </div>

          {/* ROI Calculator */}
          <div className="mt-12 rounded-2xl bg-white p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <p className="text-[13px] font-semibold uppercase tracking-widest text-[#0071e3]">費用対効果</p>
            <h3 className="mt-2 text-[22px] font-bold text-[#1d1d1f]">月額5万円で、何時間分の人件費が節約できるか</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-[#f5f5f7] p-5">
                <p className="text-[13px] text-[#6e6e73]">議事録作成（月2回）</p>
                <p className="mt-2 text-[20px] font-bold text-[#1d1d1f]">2時間 → 50分</p>
                <p className="mt-1 text-[13px] font-medium text-[#0071e3]">月2.3時間の節約</p>
              </div>
              <div className="rounded-xl bg-[#f5f5f7] p-5">
                <p className="text-[13px] text-[#6e6e73]">担当者交代の引き継ぎ（年2回）</p>
                <p className="mt-2 text-[20px] font-bold text-[#1d1d1f]">1ヶ月 → 3日</p>
                <p className="mt-1 text-[13px] font-medium text-[#0071e3]">月換算20時間以上の節約</p>
              </div>
              <div className="rounded-xl bg-[#f5f5f7] p-5">
                <p className="text-[13px] text-[#6e6e73]">毎日の案件確認・報告</p>
                <p className="mt-2 text-[20px] font-bold text-[#1d1d1f]">45分 → 10分</p>
                <p className="mt-1 text-[13px] font-medium text-[#0071e3]">月11時間の節約</p>
              </div>
            </div>
            <div className="mt-6 rounded-xl border border-[#0071e3]/20 bg-[#0071e3]/5 p-5 text-center">
              <p className="text-[14px] text-[#6e6e73]">担当者5名のチームで合計すると、月間</p>
              <p className="mt-1 text-[32px] font-bold tracking-tight text-[#1d1d1f]">約165時間 <span className="text-[17px] font-normal text-[#6e6e73]">の節約</span></p>
              <p className="mt-1 text-[13px] text-[#6e6e73]">時給3,000円換算で <span className="font-semibold text-[#1d1d1f]">月約49万円相当</span> → Kura月額5万円で <span className="font-semibold text-[#0071e3]">約10倍のROI</span></p>
            </div>
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
      <section id="faq" className="bg-white px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <p className="text-[13px] font-medium uppercase tracking-widest text-[#6e6e73]">FAQ</p>
            <h2 className="mt-4 text-[40px] font-bold tracking-[-0.02em] text-[#1d1d1f]">よくある質問</h2>
          </div>
          <div className="mt-14 divide-y divide-[#e5e5ea]">
            {FAQ.map(item => (
              <div key={item.q} className="py-6">
                <p className="text-[17px] font-semibold text-[#1d1d1f]">{item.q}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-[#6e6e73]">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="bg-[#f5f5f7] px-6 py-24">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <p className="text-[13px] font-medium uppercase tracking-widest text-[#6e6e73]">Contact</p>
            <h2 className="mt-4 text-[40px] font-bold tracking-[-0.02em] text-[#1d1d1f]">デモを申し込む</h2>
            <p className="mt-4 text-[17px] text-[#6e6e73]">
              フォームを送信後、3営業日以内にご連絡します。
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

    </div>
  )
}
