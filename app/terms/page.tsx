import Link from 'next/link'

export const metadata = {
  title: '利用規約 | Kura',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link href="/login" className="text-sm text-slate-500 hover:text-slate-700">
            ← ログインページへ戻る
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">利用規約</h1>
          <p className="mt-2 text-sm text-slate-500">最終更新日：2026年6月5日</p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700">

            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">第1条（適用）</h2>
              <p>
                本規約は、当社が提供するフロント管理AI（以下「本サービス」）の利用に関する条件を定めるものです。
                本サービスを利用することにより、利用者は本規約に同意したものとみなします。
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">第2条（利用資格）</h2>
              <p>本サービスは、分譲マンション管理会社およびその従業員を主な対象としています。</p>
              <p className="mt-2">
                当社は、以下に該当する場合、利用登録の拒否またはアカウントの停止を行うことができます。
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>虚偽の情報で登録した場合</li>
                <li>過去に本規約違反により利用停止となった場合</li>
                <li>その他当社が不適切と判断した場合</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">第3条（アカウント管理）</h2>
              <p>
                利用者はアカウント情報を自己の責任で管理し、第三者への譲渡・貸与はできません。
                アカウントの不正利用による損害について、当社は責任を負いません。
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">第4条（AI機能の利用）</h2>
              <p>
                本サービスのAI機能（文書生成・議事録作成・提案機能等）はOpenAI APIを利用しています。
                AI機能の出力は参考情報であり、最終的な判断は利用者ご自身が行ってください。
              </p>
              <p className="mt-2">
                AI機能の利用時、入力データがOpenAIのサーバーに送信されます。
                詳細は
                <Link href="/privacy" className="text-emerald-600 underline hover:text-emerald-700">
                  プライバシーポリシー
                </Link>
                をご確認ください。
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">第5条（禁止事項）</h2>
              <p>利用者は以下の行為を行ってはなりません。</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>法令または公序良俗に違反する行為</li>
                <li>本サービスの運営を妨害する行為</li>
                <li>他の利用者または第三者の権利を侵害する行為</li>
                <li>本サービスを競合サービスの開発・調査目的で利用する行為</li>
                <li>不正アクセスその他のセキュリティを侵害する行為</li>
                <li>反社会的勢力への利益供与その他の協力行為</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">第6条（料金・支払い）</h2>
              <p>
                有料プランの料金は、別途定める料金表に従います。
                支払いが遅延した場合、当社はサービスの利用を停止することがあります。
                一度支払われた料金は、法令に定める場合を除き返金しません。
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">第7条（データの取り扱い）</h2>
              <p>
                利用者が本サービスに登録したデータの権利は利用者に帰属します。
                当社は、サービス提供の目的の範囲内でのみデータを利用します。
              </p>
              <p className="mt-2">
                アカウント解約後のデータ保持期間は別途定めるものとし、
                期間経過後に削除されます。
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">第8条（免責事項）</h2>
              <p>
                当社は、本サービスの利用によって生じた損害について、
                当社の故意または重大な過失による場合を除き、責任を負いません。
              </p>
              <p className="mt-2">
                AI機能が生成したコンテンツの正確性・完全性について、当社は保証しません。
                生成されたコンテンツの利用に伴う損害についても、当社は責任を負いません。
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">第9条（サービスの変更・停止）</h2>
              <p>
                当社は、事前の通知なく本サービスの内容を変更・停止・終了することがあります。
                これによって生じた損害について、当社は責任を負いません。
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">第10条（規約の変更）</h2>
              <p>
                当社は、必要と判断した場合に本規約を変更できます。
                変更後の規約は本ページへの掲載をもって効力を生じ、
                変更後も本サービスを継続利用した場合は変更に同意したものとみなします。
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">第11条（準拠法・管轄）</h2>
              <p>
                本規約は日本法に準拠し、紛争が生じた場合は当社所在地を管轄する裁判所を
                専属的合意管轄とします。
              </p>
            </section>

          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          <Link href="/privacy" className="hover:text-slate-600">プライバシーポリシー</Link>
          <span className="mx-2">·</span>
          <Link href="/security" className="hover:text-slate-600">セキュリティ</Link>
          <span className="mx-2">·</span>
          <Link href="/login" className="hover:text-slate-600">ログイン</Link>
        </div>
      </div>
    </div>
  )
}
