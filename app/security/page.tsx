import Link from 'next/link'

export const metadata = {
  title: 'セキュリティ | Kura',
}

const SECURITY_ITEMS = [
  {

    title: 'マルチテナント完全分離',
    body: '全データは company_id で厳密に分離されています。A社のデータがB社から閲覧・操作されることは設計上あり得ません。データベース・APIの両レイヤーで分離を保証しています。',
  },
  {
    title: '行レベルセキュリティ（RLS）',
    body: 'Supabase PostgreSQLの行レベルセキュリティ（RLS）により、データベース側でもアクセス制御を実施。APIが突破されてもDBレイヤーで不正アクセスをブロックします。',
  },
  {
    title: '通信の完全暗号化',
    body: 'すべての通信はTLS/HTTPS暗号化で保護されています。通信経路上でのデータ盗聴・改ざんを防止します。',
  },
  {
    title: '権限管理（ロールベースアクセス制御）',
    body: 'ユーザーには admin（管理者）/ general（一般）/ viewer（閲覧のみ）の3段階の権限が設定できます。一般担当者が誤って重要データを削除するリスクを最小化します。',
  },
  {
    title: 'クラウドインフラのセキュリティ',
    body: 'データはSupabase（PostgreSQL）に保管されます。Supabaseはビジネス・エンタープライズ向けのSOC 2 Type 2認証取得済みクラウドサービスです。ファイルはSupabase Storageにより暗号化保存されます。',
  },
  {
    title: 'AI機能とデータ取り扱い',
    body: '議事録生成・AI引き継ぎ書などの機能ではOpenAI APIを利用しています。OpenAIはAPI利用データをモデルのトレーニングに使用しないことを規約で定めています。入力データには物件情報・議事内容が含まれる場合があります。',
  },
  {
    title: '認証セキュリティ',
    body: 'Supabase Authを使用したセキュアな認証基盤を採用。セッショントークンはHttpOnly Cookieで管理し、XSS攻撃によるトークン窃取を防止します。',
  },
  {
    title: '監査ログ',
    body: '案件の更新・タスク完了などの主要な操作はログとして記録されます。担当者の行動履歴の追跡や、不正操作の検知に活用できます。',
  },
]

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link href="/login" className="text-sm text-slate-500 hover:text-slate-700">
            ← ログインページへ戻る
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <span className="text-lg font-extrabold text-white">K</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">セキュリティについて</h1>
              <p className="text-sm text-slate-500">Kura — 分譲マンション管理会社向けSaaS</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Kuraはマンション管理会社の業務に特化したSaaSです。
            居住者の個人情報・管理費情報・議事録等のセンシティブなデータを扱うため、
            セキュリティを最優先事項として設計・運用しています。
          </p>

          {/* セキュリティ概要カード */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SECURITY_ITEMS.map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-800">{item.title}</h2>
                </div>
                <p className="text-xs leading-6 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>

          {/* インフラ概要表 */}
          <div className="mt-8">
            <h2 className="mb-3 text-base font-bold text-slate-900">利用インフラ</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">用途</th>
                    <th className="px-4 py-2.5 text-left font-medium">サービス</th>
                    <th className="px-4 py-2.5 text-left font-medium">データセンター</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { use: 'データベース', service: 'Supabase (PostgreSQL)', dc: '日本リージョン' },
                    { use: 'ファイルストレージ', service: 'Supabase Storage', dc: '日本リージョン' },
                    { use: '認証', service: 'Supabase Auth', dc: '日本リージョン' },
                    { use: 'AI生成（議事録等）', service: 'OpenAI API', dc: '米国' },
                    { use: 'メール送信（督促）', service: 'Resend', dc: '米国' },
                    { use: 'アプリホスティング', service: 'Vercel', dc: '東京' },
                  ].map(row => (
                    <tr key={row.use} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-700">{row.use}</td>
                      <td className="px-4 py-2.5 text-slate-600">{row.service}</td>
                      <td className="px-4 py-2.5 text-slate-500">{row.dc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* お問い合わせ */}
          <div className="mt-8 rounded-xl bg-blue-50 border border-blue-100 p-5">
            <h2 className="mb-2 text-sm font-bold text-blue-900">セキュリティに関するお問い合わせ</h2>
            <p className="text-xs leading-6 text-blue-700">
              セキュリティ上の懸念・脆弱性の報告・詳細な情報セキュリティ資料（稟議用）のご要望は、
              サービス内のサポート窓口よりお問い合わせください。
              管理会社様の情報セキュリティ委員会向けの資料も別途ご用意できます。
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          <Link href="/privacy" className="hover:text-slate-600">プライバシーポリシー</Link>
          <span className="mx-2">·</span>
          <Link href="/terms" className="hover:text-slate-600">利用規約</Link>
          <span className="mx-2">·</span>
          <Link href="/login" className="hover:text-slate-600">ログイン</Link>
        </div>
      </div>
    </div>
  )
}
