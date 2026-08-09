import Link from 'next/link'
import type { Metadata } from 'next'
import KuraLogo from '@/app/components/KuraLogo'
import PrintButton from './PrintButton'

export const metadata: Metadata = {
  title: 'Kura サービス資料 | 分譲マンション管理会社向けSaaS',
  description: 'Kuraの機能・セキュリティ・料金をまとめたサービス資料です。稟議・上申用にPDFでダウンロードいただけます。',
  robots: { index: false },
}

const SECURITY_ITEMS = [
  { label: '通信暗号化', body: 'すべての通信はTLS（HTTPS）で暗号化。平文での送受信は行いません。' },
  { label: 'クラウド基盤', body: 'データはSupabase（ISO/IEC 27001認定・SOC 2 Type II認定）に保存。クラウドセキュリティの国際基準に準拠しています。' },
  { label: 'AI学習への利用なし', body: 'アップロードされた音声・議事録データは、AIモデルの学習・改善には一切使用しません。データは議事録生成のみに使用します。' },
  { label: 'データ削除・退会', body: 'マイページからいつでも音声・議事録データを削除できます。退会後30日以内に全データを完全消去します。' },
  { label: '役割別アクセス権限', body: '管理者・一般・閲覧の3種類の権限を設定可能。担当者ごとにアクセスできる情報を制限します。' },
  { label: '操作ログ記録', body: 'だれがいつ何を操作したかを自動記録。内部監査・情報セキュリティ管理に活用できます。' },
  { label: '会社ごとのデータ完全分離', body: '複数の管理会社が同一システムを利用しても、データは会社単位で完全に分離されています。他社のデータに触れることは物理的に不可能です。' },
]

const ALL_FEATURES = [
  { cat: '物件・居住者管理', items: ['物件管理', '居住者管理', '居住者ポータル（問い合わせ受付）'] },
  { cat: 'クレーム・トラブル対応', items: ['クレーム管理', 'アラート通知（メール自動送信）'] },
  { cat: '修繕・工事管理', items: ['事業計画進捗管理', '修繕工事管理', '長期修繕計画管理', '法定点検管理'] },
  { cat: '見積・収支管理', items: ['見積管理', 'AI見積比較（複数見積を自動比較）'] },
  { cat: '業者・外部連携', items: ['業者管理', 'CSVインポート（物件・居住者の一括登録）'] },
  { cat: '分析・管理', items: ['ダッシュボード（全物件をリアルタイム俯瞰）', 'カレンダー（理事会・点検・工事の予定管理）', 'AI月次レポート自動作成', 'ユーザー管理・権限設定', '操作ログ記録'] },
]

const PRICING = [
  {
    name: 'スターター',
    price: '¥50,000',
    unit: '/ 月（税抜）',
    sub: '1名あたり月¥10,000',
    users: 'ユーザー5名まで・棟数無制限',
    features: ['全機能が利用可能', '棟数無制限', 'メールサポート'],
    highlight: false,
  },
  {
    name: 'スタンダード',
    price: '¥98,000',
    unit: '/ 月（税抜）',
    sub: '1名あたり月¥6,534',
    users: 'ユーザー15名まで・棟数無制限',
    features: ['全機能が利用可能', '棟数無制限', 'メール・チャットサポート'],
    highlight: true,
  },
  {
    name: 'エンタープライズ',
    price: '要相談',
    unit: '',
    sub: 'ユーザー・棟数無制限',
    users: 'ユーザー無制限・棟数無制限',
    features: ['全機能が利用可能', '専任サポート担当', 'CSV一括インポート支援', '稟議用セキュリティ資料提供'],
    highlight: false,
  },
]

export default function BrochurePage() {
  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .page-break { page-break-before: always; break-before: page; }
          @page { margin: 15mm; size: A4; }
          body { font-size: 10pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-break { break-inside: avoid; page-break-inside: avoid; }
          h2 { break-after: avoid; page-break-after: avoid; }
          h3 { break-after: avoid; page-break-after: avoid; }
        }
      `}</style>

      <div
        className="min-h-screen bg-white text-[#1C2B38]"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif' }}
      >
        {/* NAV — hidden on print */}
        <div className="no-print sticky top-0 z-50 bg-white border-b border-[#D4CFC5] px-6 py-3 flex items-center justify-between">
          <Link href="/lp" className="text-[14px] text-[#546471] hover:text-[#1C2B38] transition-colors">
            ← LPに戻る
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-[#546471]">このページをPDFで保存して稟議・共有にお使いください</span>
            <PrintButton />
          </div>
        </div>

        {/* COVER */}
        <div className="no-break bg-[#0D1C2E] text-white px-8 py-20 text-center">
          <div className="flex justify-center mb-6">
            <KuraLogo size={52} variant="seal" />
          </div>
          <h1 className="text-[38px] font-bold tracking-[-0.02em]">Kura</h1>
          <p className="mt-2 text-[18px] text-[#4ABDA0] font-medium">分譲マンション管理会社向け AI 業務管理 SaaS</p>
          <p className="mt-3 text-[15px] text-[#9DB5BF]">サービス資料 — 2026年版</p>
          <div className="mt-12 text-[17px] text-[#C2D4DE] leading-relaxed space-y-1">
            <p>担当者が辞めても止まらない管理会社へ。</p>
            <p>議事録作成 · 引き継ぎ書 · タスク管理をワンストップで。</p>
          </div>
          <div className="mt-10 inline-block rounded-xl border border-[#1F3447] px-6 py-4 text-left text-[13px] text-[#9DB5BF] space-y-1">
            <p>本資料の対象：分譲マンション管理会社 フロント担当者・管理職</p>
            <p>URL：kura-management.com</p>
            <p>お問い合わせ：kura-management.com/lp#contact</p>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="max-w-4xl mx-auto px-8 py-12">

          {/* 1. サービス概要 */}
          <section className="mb-14">
            <h2 className="text-[22px] font-bold text-[#1C2B38] pb-3 border-b-2 border-[#1A6B4A]">1. サービス概要</h2>
            <p className="mt-5 text-[15px] leading-[1.8] text-[#374955]">
              Kuraは、分譲マンション管理会社向けに特化したAI業務管理SaaSです。総会・理事会の議事録作成、担当者間の引き継ぎ、案件タスクの進捗管理を一元化し、属人化による業務リスクを解消します。
            </p>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { title: '担当者が辞めると業務が止まる', body: '引き継ぎに1〜3ヶ月かかり、対外クレームが多発。AIが引き継ぎ書を自動生成し、担当交代コストを最小化します。' },
                { title: '議事録作成に毎回2時間以上', body: '音声をアップロードするだけで、自社書式の議事録を約50分で作成。宿題タスクも自動抽出します。' },
                { title: 'Excelでの期限管理は限界', body: '法定点検・修繕計画の期限をシステムで一元管理。期限漏れをゼロにします。' },
              ].map(p => (
                <div key={p.title} className="no-break rounded-xl border border-[#D4CFC5] p-5">
                  <h3 className="text-[13px] font-bold text-[#1C2B38] mb-2 leading-snug">{p.title}</h3>
                  <p className="text-[12px] leading-relaxed text-[#546471]">{p.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 2. 主要機能 */}
          <section className="mb-14">
            <h2 className="text-[22px] font-bold text-[#1C2B38] pb-3 border-b-2 border-[#1A6B4A]">2. 主要3機能</h2>
            <div className="mt-6 space-y-5">
              {[
                {
                  name: '案件・タスク管理',
                  desc: '全物件の案件・タスク・期限・担当者をリアルタイムで一元管理。担当者が頭の中で管理していた業務を見える化します。',
                  items: ['物件別・担当者別の案件一覧', '期限アラートと優先度管理', 'ステータス管理（未着手・対応中・完了）', '法定点検スケジュール自動管理'],
                },
                {
                  name: 'AI議事録自動生成',
                  desc: '総会・理事会の音声をアップロードするだけで議事録を自動生成。宿題・タスクも自動抽出し、案件管理に直接登録します。',
                  items: ['MP3 / M4A / WAV 対応', '自社フォーマット自動学習・適用', 'タスク自動抽出・案件登録', 'PDF出力・校正・編集に対応'],
                },
                {
                  name: 'AI引き継ぎ書自動生成',
                  desc: '物件を選択するだけで、案件履歴・特記事項・居住者情報・修繕経緯をAIが整理。担当交代のコストを最小化します。',
                  items: ['物件ごとの引き継ぎ書を一括生成', '案件・タスク・クレーム履歴を自動整理', 'Word / PDF 出力対応', '担当者交代履歴の記録'],
                },
              ].map(f => (
                <div key={f.name} className="no-break rounded-xl border border-[#D4CFC5] p-6">
                  <h3 className="text-[16px] font-bold text-[#1C2B38] mb-1">{f.name}</h3>
                  <p className="text-[13px] text-[#546471] leading-relaxed mb-4">{f.desc}</p>
                  <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
                    {f.items.map(item => (
                      <li key={item} className="flex items-center gap-2 text-[12px] text-[#374955]">
                        <span className="text-[#1A6B4A] font-bold shrink-0">✓</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* PAGE BREAK */}
          <div className="page-break" />

          {/* 3. 全機能一覧 */}
          <section className="mb-14">
            <h2 className="text-[22px] font-bold text-[#1C2B38] pb-3 border-b-2 border-[#1A6B4A]">3. 全機能一覧</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {ALL_FEATURES.map(cat => (
                <div key={cat.cat} className="no-break rounded-xl border border-[#D4CFC5] p-5">
                  <h3 className="text-[12px] font-bold uppercase tracking-wide text-[#546471] mb-3 pb-2 border-b border-[#D4CFC5]">
                    {cat.cat}
                  </h3>
                  <ul className="space-y-2">
                    {cat.items.map(item => (
                      <li key={item} className="flex items-start gap-2 text-[13px] text-[#1C2B38]">
                        <span className="text-[#1A6B4A] shrink-0 mt-0.5">●</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* 4. スマートフォン対応 */}
          <section className="no-break mb-14">
            <h2 className="text-[22px] font-bold text-[#1C2B38] pb-3 border-b-2 border-[#1A6B4A]">4. スマートフォン・外出先からの利用</h2>
            <p className="mt-5 text-[15px] leading-[1.8] text-[#374955]">
              Kuraはスマートフォンブラウザに完全対応しています。アプリのインストールは不要です。外出先や現場からでも、ダッシュボード・案件確認・アラート確認が可能です。
            </p>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { title: 'アプリ不要', desc: 'ブラウザだけで利用可能。iPhoneでもAndroidでも同じ画面で使えます。' },
                { title: '現場から即確認', desc: '外出先から案件・期限・アラートをリアルタイム確認できます。' },
                { title: 'どのデバイスでも同期', desc: 'PCで入力したデータがスマホにも即時反映。担当者間でリアルタイム共有。' },
              ].map(item => (
                <div key={item.title} className="no-break rounded-xl bg-[#F6F3EC] p-5">
                  <h3 className="text-[13px] font-bold text-[#1C2B38] mb-2">{item.title}</h3>
                  <p className="text-[12px] text-[#546471] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* PAGE BREAK */}
          <div className="page-break" />

          {/* 5. セキュリティ */}
          <section className="mb-14">
            <h2 className="text-[22px] font-bold text-[#1C2B38] pb-3 border-b-2 border-[#1A6B4A]">5. セキュリティ・安全性</h2>
            <p className="mt-5 text-[14px] text-[#546471] leading-relaxed">
              理事会・総会の音声には個人名・金額・クレームなど機密情報が含まれます。Kuraは以下のセキュリティ対策を実施しています。
            </p>
            <div className="mt-6 rounded-xl border border-[#D4CFC5] overflow-hidden divide-y divide-[#D4CFC5]">
              {SECURITY_ITEMS.map(item => (
                <div key={item.label} className="no-break flex gap-6 px-6 py-4 bg-white">
                  <p className="text-[13px] font-semibold text-[#1C2B38] shrink-0 w-44 leading-relaxed">{item.label}</p>
                  <p className="text-[13px] leading-relaxed text-[#546471]">{item.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[12px] text-[#9DB5BF]">
              ※セキュリティに関する詳細はkura-management.com/securityをご覧ください。
            </p>
          </section>

          {/* PAGE BREAK */}
          <div className="page-break" />

          {/* 6. 料金プラン */}
          <section className="mb-14">
            <h2 className="text-[22px] font-bold text-[#1C2B38] pb-3 border-b-2 border-[#1A6B4A]">6. 料金プラン</h2>
            <p className="mt-5 text-[14px] text-[#546471]">
              すべてのプランで棟数は無制限。14日間の無料トライアル後、有料プランに移行します。クレジットカード不要で今日から利用開始できます。
            </p>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {PRICING.map(plan => (
                <div
                  key={plan.name}
                  className={`no-break rounded-xl p-6 ${plan.highlight ? 'bg-[#1A6B4A] text-white' : 'border border-[#D4CFC5]'}`}
                >
                  <h3 className={`text-[15px] font-bold ${plan.highlight ? 'text-white' : 'text-[#1C2B38]'}`}>{plan.name}</h3>
                  <p className={`text-[11px] mt-0.5 ${plan.highlight ? 'text-white/70' : 'text-[#546471]'}`}>{plan.sub}</p>
                  <div className="mt-4">
                    <span className={`text-[26px] font-bold tracking-tight ${plan.highlight ? 'text-white' : 'text-[#1C2B38]'}`}>{plan.price}</span>
                    <span className={`text-[11px] ml-1 ${plan.highlight ? 'text-white/70' : 'text-[#546471]'}`}>{plan.unit}</span>
                  </div>
                  <p className={`text-[12px] mt-1 ${plan.highlight ? 'text-white/80' : 'text-[#546471]'}`}>{plan.users}</p>
                  <ul className="mt-4 space-y-1.5">
                    {plan.features.map(f => (
                      <li key={f} className={`text-[12px] flex items-start gap-1.5 ${plan.highlight ? 'text-white/90' : 'text-[#374955]'}`}>
                        <span className={`shrink-0 font-bold ${plan.highlight ? 'text-white' : 'text-[#1A6B4A]'}`}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* 7. 導入ステップ・お問い合わせ */}
          <section className="mb-12">
            <h2 className="text-[22px] font-bold text-[#1C2B38] pb-3 border-b-2 border-[#1A6B4A]">7. 導入ステップ・お問い合わせ</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { step: '01', title: '無料トライアル申込', desc: 'kura-management.com/signup から会社名・メールアドレスを登録。カード不要・2分で完了。' },
                { step: '02', title: '物件・担当者を登録', desc: 'CSVインポートで一括登録できます。IT担当者の対応不要。' },
                { step: '03', title: '全機能を14日間無料で', desc: '本番環境と同一機能を制限なしでお試しいただけます。' },
              ].map(s => (
                <div key={s.step} className="no-break rounded-xl bg-[#F6F3EC] p-5">
                  <p className="text-[26px] font-bold text-[#1A6B4A]">{s.step}</p>
                  <h3 className="mt-2 text-[14px] font-semibold text-[#1C2B38]">{s.title}</h3>
                  <p className="mt-1 text-[12px] text-[#546471] leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>

            <div className="no-break mt-6 rounded-xl border border-[#D4CFC5] p-6">
              <h3 className="text-[15px] font-bold text-[#1C2B38] mb-4">お問い合わせ</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-[13px]">
                <div>
                  <p className="font-semibold text-[#1C2B38]">Webフォーム（推奨）</p>
                  <p className="text-[#546471] mt-1">kura-management.com/lp#contact</p>
                  <p className="text-[#546471] text-[12px] mt-1">原則3営業日以内にメールで回答します。</p>
                </div>
                <div>
                  <p className="font-semibold text-[#1C2B38]">無料トライアル</p>
                  <p className="text-[#546471] mt-1">kura-management.com/signup</p>
                  <p className="text-[#546471] text-[12px] mt-1">クレジットカード不要・登録2分・14日間無料</p>
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <div className="no-break border-t border-[#D4CFC5] pt-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <KuraLogo size={16} variant="seal" />
              <span className="text-[13px] font-semibold text-[#1C2B38]">Kura</span>
            </div>
            <p className="text-[12px] text-[#9DB5BF]">© 2024 Kura — kura-management.com</p>
            <p className="mt-1 text-[11px] text-[#9DB5BF]">本資料の情報は2026年時点のものです。最新情報はWebサイトでご確認ください。</p>
          </div>
        </div>
      </div>
    </>
  )
}
