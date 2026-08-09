import Link from 'next/link'
import type { Metadata } from 'next'
import KuraLogo from '@/app/components/KuraLogo'

export const metadata: Metadata = {
  title: 'Kura 全機能一覧｜マンション管理会社向けSaaS',
  description: 'Kuraの全機能を紹介。AI議事録・案件タスク管理・AI引き継ぎ書・物件管理・居住者管理・修繕工事管理・法定点検管理・見積管理など、マンション管理会社の業務をワンストップで効率化します。',
}

const MAIN_FEATURES = [
  {
    label: 'コア機能',
    name: '案件・タスク管理',
    description: '全物件の案件・タスク・期限・担当者をリアルタイムで一元管理。担当者が頭の中で管理していた業務を見える化します。',
    items: ['物件別・担当者別の案件一覧', '期限アラートと優先度管理', 'ステータス管理（未着手・対応中・完了）', '法定点検スケジュール自動管理'],
  },
  {
    label: 'AI機能',
    name: 'AI議事録自動生成',
    description: '総会・理事会の音声をアップロードするだけで議事録を自動生成。宿題・タスクも自動抽出し、案件管理に直接登録します。',
    items: ['MP3 / M4A / WAV 対応', '自社フォーマット自動学習・適用', 'タスク自動抽出・案件登録', 'PDF出力・校正・編集に対応'],
  },
  {
    label: 'AI機能',
    name: 'AI引き継ぎ書自動生成',
    description: '物件を選択するだけで、案件履歴・特記事項・居住者情報・修繕経緯をAIが整理。担当交代のコストを最小化します。',
    items: ['物件ごとの引き継ぎ書を一括生成', '案件・タスク・クレーム履歴を自動整理', 'Word / PDF 出力対応', '担当者交代履歴の記録'],
  },
  {
    label: '管理機能',
    name: '事業計画進捗管理',
    description: '総会で承認された事業計画の進捗を物件ごとに管理。予算・実績・施工会社・実施時期を一覧化し、理事会報告用の資料をWord/PDFで出力できます。',
    items: ['予算・実績・施工会社・実施時期を管理', '実施時期の期限アラート（30日前・期限切れ）', 'Word（.docx）/ PDF出力で理事会資料に', 'ダッシュボードで期限切れ計画を一覧表示'],
  },
]

const OTHER_FEATURES: { category: string; items: { name: string; desc: string }[] }[] = [
  {
    category: '物件・居住者管理',
    items: [
      { name: '物件管理', desc: '管理棟の基本情報・戸数・所在地を一元管理。物件カード形式で全棟の状況を俯瞰できます。' },
      { name: '居住者管理', desc: '居住者・区分所有者の情報を物件ごとに管理。居住者ポータルから直接連絡を受け取ることも可能です。' },
      { name: '居住者ポータル', desc: '居住者専用の連絡窓口。問い合わせ・修繕依頼をオンラインで受け付け、対応履歴を自動記録します。' },
    ],
  },
  {
    category: 'クレーム・トラブル対応',
    items: [
      { name: 'クレーム管理', desc: '騒音・ペット・共用部マナー違反などのクレームを物件ごとに記録。対応履歴と結果を一元管理します。' },
      { name: 'アラート通知', desc: '期限超過・未対応案件・法定点検期限をメールで自動通知。見落としを防ぎます。' },
    ],
  },
  {
    category: '修繕・工事管理',
    items: [
      { name: '修繕工事管理', desc: '大規模修繕から小規模修繕まで、工事ごとの進捗・業者・金額を管理します。' },
      { name: '長期修繕計画管理', desc: '物件ごとの長期修繕計画を管理。修繕積立金の収支シミュレーションも可能です。' },
      { name: '法定点検管理', desc: 'エレベーター・消防設備・貯水槽など法定点検の期限を自動追跡。次回点検日のアラートを送信します。' },
    ],
  },
  {
    category: '見積・収支管理',
    items: [
      { name: '見積管理', desc: '工事・委託契約の見積書を案件に紐付けて管理。相見積もりの比較もKura上で完結します。' },
      { name: 'AI見積比較', desc: '複数の見積書をアップロードするだけで、AIが項目ごとに比較表を自動作成します。' },
    ],
  },
  {
    category: '業者・外部連携',
    items: [
      { name: '業者管理', desc: '工事・清掃・点検など取引業者の連絡先・実績を管理。案件から直接業者を参照できます。' },
      { name: 'CSVインポート', desc: '物件・居住者データをCSVで一括インポート。既存データの移行もスムーズです。' },
    ],
  },
  {
    category: '分析・管理',
    items: [
      { name: 'ダッシュボード', desc: '全物件の案件・タスク・アラートをリアルタイムで俯瞰。今日やるべきことが一目でわかります。' },
      { name: 'カレンダー', desc: '理事会・総会・点検・工事の予定をカレンダー形式で管理。物件をまたいだスケジュール確認が可能です。' },
      { name: '月次レポート', desc: '物件ごとの月次業務レポートをAIが自動作成。管理組合への報告資料としてそのまま使用できます。' },
      { name: 'ユーザー管理', desc: '担当者ごとのアクセス権限（管理者・一般・閲覧）を設定。情報の適切な管理を実現します。' },
      { name: '操作ログ', desc: 'だれがいつ何を操作したかを記録。内部監査・情報漏洩対策に役立ちます。' },
    ],
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#e5e5ea]">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <KuraLogo size={28} variant="seal" />
            <span className="text-[18px] font-bold text-[#1d1d1f]">Kura</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/lp" className="text-[14px] text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">サービス紹介</Link>
            <Link href="/signup" className="rounded-full bg-[#0071e3] px-5 py-2 text-[13px] font-medium text-white hover:bg-[#0077ed] transition-colors">
              無料で試す
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center border-b border-[#e5e5ea]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#0071e3] mb-5">Features</p>
        <h1 className="text-[42px] font-bold tracking-[-0.025em] text-[#1d1d1f] leading-[1.15] mb-6">
          マンション管理業務に必要な機能を、<br />ワンストップで。
        </h1>
        <p className="text-[17px] text-[#6e6e73] max-w-xl mx-auto leading-relaxed mb-10">
          議事録作成から引き継ぎ書、法定点検管理、クレーム対応まで。
          フロント担当者の日常業務をKura一つで完結できます。
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/signup" className="rounded-full bg-[#0071e3] px-8 py-3 text-[15px] font-medium text-white hover:bg-[#0077ed] transition-colors">
            14日間無料で試す
          </Link>
          <Link href="/signup" className="rounded-full border border-[#d2d2d7] px-8 py-3 text-[15px] font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors">
            デモを見る
          </Link>
        </div>
      </section>

      {/* Main Features */}
      <section className="px-6 py-20 bg-[#f5f5f7]">
        <div className="mx-auto max-w-5xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#6e6e73] mb-2 text-center">Core Features</p>
          <h2 className="text-[28px] font-bold text-[#1d1d1f] mb-12 text-center">主要3機能</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {MAIN_FEATURES.map((f) => (
              <div key={f.name} className="rounded-2xl bg-white p-8 border border-[#e5e5ea]">
                <div className="flex items-center justify-between mb-5">
                  <span className="rounded-full bg-[#e8f0fe] px-3 py-1 text-[11px] font-semibold text-[#0071e3] tracking-wide">{f.label}</span>
                </div>
                <h3 className="text-[17px] font-bold text-[#1d1d1f] mb-3">{f.name}</h3>
                <p className="text-[13px] text-[#6e6e73] leading-relaxed mb-6">{f.description}</p>
                <ul className="space-y-2 border-t border-[#e5e5ea] pt-5">
                  {f.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px] text-[#1d1d1f]">
                      <span className="mt-0.5 shrink-0 text-[#0071e3]">
                        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Other Features */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#6e6e73] mb-2 text-center">All Features</p>
          <h2 className="text-[28px] font-bold text-[#1d1d1f] mb-12 text-center">その他の機能</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {OTHER_FEATURES.map((cat) => (
              <div key={cat.category} className="rounded-2xl border border-[#e5e5ea] p-7">
                <h3 className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#6e6e73] mb-5 pb-4 border-b border-[#e5e5ea]">
                  {cat.category}
                </h3>
                <div className="space-y-5">
                  {cat.items.map((item) => (
                    <div key={item.name}>
                      <p className="text-[14px] font-semibold text-[#1d1d1f] mb-1">{item.name}</p>
                      <p className="text-[13px] text-[#6e6e73] leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1d1d1f] px-6 py-20 text-center">
        <h2 className="text-[28px] font-bold text-white mb-3">全機能を14日間、無料でお試しください。</h2>
        <p className="text-[15px] text-white/60 mb-8">クレジットカード不要・登録2分・いつでも解約できます。</p>
        <Link href="/signup" className="inline-block rounded-full bg-[#0071e3] px-10 py-4 text-[15px] font-medium text-white hover:bg-[#0077ed] transition-colors">
          無料トライアルを始める
        </Link>
      </section>
    </div>
  )
}
