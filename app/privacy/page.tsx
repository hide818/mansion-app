import Link from 'next/link'

export const metadata = {
  title: 'プライバシーポリシー | フロント管理AI',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link href="/login" className="text-sm text-slate-500 hover:text-slate-700">
            ← ログインページへ戻る
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">プライバシーポリシー</h1>
          <p className="mt-2 text-sm text-slate-500">最終更新日：2026年6月5日</p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700">

            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">1. 基本方針</h2>
              <p>
                本サービス（以下「当サービス」）を運営する事業者（以下「当社」）は、
                お客様の個人情報の保護を重要な責務と認識し、
                個人情報の保護に関する法律（個人情報保護法）を遵守し、
                適切な取り扱いに努めます。
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">2. 収集する情報</h2>
              <p>当社は、サービス提供にあたり以下の情報を収集する場合があります。</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>氏名、メールアドレス等の登録情報</li>
                <li>業務上入力される物件情報・案件情報・タスク情報・クレーム情報</li>
                <li>理事会議事録として録音・入力される音声データおよびテキストデータ</li>
                <li>サービス利用状況に関するログデータ</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">3. 利用目的</h2>
              <p>収集した情報は、以下の目的で利用します。</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>サービスの提供・運営・改善</li>
                <li>お客様へのサポート対応</li>
                <li>サービスに関する通知・連絡</li>
                <li>利用規約違反等への対応</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">4. AIサービスへのデータ送信について</h2>
              <p>
                当サービスは、文書生成・議事録作成・AI提案等の機能において、
                OpenAI, Inc.（米国）が提供するAPIを利用しています。
                これらの機能をご利用の際、入力されたテキストデータ（案件情報・議事録内容等）が
                OpenAIのサーバーに送信されます。
              </p>
              <p className="mt-3">
                送信されるデータには、物件名・案件内容・クレーム内容・居住者情報等が含まれる場合があります。
                OpenAIにおけるデータの取り扱いについては、
                <a
                  href="https://openai.com/policies/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 underline hover:text-emerald-700"
                >
                  OpenAIプライバシーポリシー
                </a>
                をご参照ください。
              </p>
              <p className="mt-3">
                個人情報保護の観点から、AI機能への入力時には特定個人が識別できる情報（氏名・住所・電話番号等）の入力を
                必要最小限にとどめることを推奨します。
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">5. 第三者提供</h2>
              <p>
                当社は、以下の場合を除き、お客様の個人情報を第三者に提供しません。
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>お客様の同意がある場合</li>
                <li>法令に基づく場合</li>
                <li>サービス提供に必要な業務委託先（OpenAI等）への提供</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">6. データの管理・保管</h2>
              <p>
                お客様のデータは、Supabase（米国）が提供するクラウドデータベースに保管されます。
                当社は適切なアクセス制御・暗号化等のセキュリティ対策を講じます。
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">7. 開示・訂正・削除</h2>
              <p>
                お客様は、ご自身の個人情報について開示・訂正・利用停止・削除を請求することができます。
                ご希望の場合は、下記お問い合わせ先までご連絡ください。
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">8. Cookieの利用</h2>
              <p>
                当サービスは、認証セッションの維持のためにCookieを使用します。
                ブラウザの設定によりCookieを無効にした場合、サービスが正常に動作しない場合があります。
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">9. ポリシーの変更</h2>
              <p>
                当社は、必要に応じて本ポリシーを変更することがあります。
                変更後のポリシーは本ページに掲載した時点から効力を生じるものとします。
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">10. お問い合わせ</h2>
              <p>
                個人情報の取り扱いに関するお問い合わせは、サービス内のサポート窓口までご連絡ください。
              </p>
            </section>

          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          <Link href="/terms" className="hover:text-slate-600">利用規約</Link>
          <span className="mx-2">·</span>
          <Link href="/login" className="hover:text-slate-600">ログイン</Link>
        </div>
      </div>
    </div>
  )
}
