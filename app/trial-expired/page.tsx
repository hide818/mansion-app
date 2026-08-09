import Link from 'next/link'

export default function TrialExpiredPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">無料トライアル期間が終了しました</h1>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          14日間の無料トライアル期間が終了しました。引き続きKuraをご利用いただくには、プランへのアップグレードが必要です。
        </p>
        <div className="mt-6">
          <a
            href="mailto:info@kura-management.com?subject=プランアップグレードについて"
            className="block w-full rounded-lg bg-gray-900 px-4 py-3 text-center text-sm font-medium text-white hover:bg-black"
          >
            info@kura-management.com へ問い合わせる
          </a>
        </div>
        <div className="mt-3">
          <Link
            href="/login"
            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ログインページへ戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
