import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  buildPropertySnapshotText,
  getPropertySupportData,
} from '@/lib/propertySupportData'

export default async function PropertyDocumentCenterPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getPropertySupportData(id)

  if (!data) notFound()

  const snapshot = buildPropertySnapshotText(data)

  const items = [
    {
      href: `/properties/${id}/document-monthly-report`,
      title: '月次報告ドラフト',
      text: '役員共有・月次共有でそのまま使いやすい文章を作る',
      category: '月次報告ドラフト生成 / AI月次報告生成',
    },
    {
      href: `/properties/${id}/document-complaint-summary`,
      title: 'クレーム共有文書',
      text: '最近のクレームを短く整理して共有文に落とす',
      category: 'AIクレーム要約 / 物件ごとのクレーム履歴',
    },
    {
      href: `/properties/${id}/document-management-brief`,
      title: '管理共有ブリーフ',
      text: '上司・社内共有向けに状況を一枚で整理する',
      category: 'AI文書整形 / AIによる判断補助',
    },
    {
      href: `/properties/${id}/document-next-actions`,
      title: '次アクション整理文書',
      text: '次にやることを優先順で出して漏れを防ぐ',
      category: 'AI次アクション提案 / おすすめアクション表示',
    },
    {
      href: `/properties/${id}/document-log-summary`,
      title: 'ログ要約文書',
      text: '最近の動きを短くまとめて流れをつかみやすくする',
      category: 'AI要約 / 対応履歴の構造化',
    },
    {
      href: `/properties/${id}/document-handover`,
      title: '引き継ぎ報告書',
      text: '担当変更や休暇前に渡せる引き継ぎ文を出す',
      category: '引き継ぎ報告書生成 / AI引き継ぎサマリー生成',
    },
    {
      href: `/properties/${id}/board-pack`,
      title: '理事会提出パック',
      text: '理事会用の材料をまとめて一気に生成する',
      category: '理事会報告ドラフト生成 / ワンクリック理事会報告',
    },
    {
      href: `/properties/${id}/handover-pack`,
      title: '引き継ぎパック',
      text: '引き継ぎ・注意点・次アクションをまとめて出す',
      category: '担当変更時の専用画面 / 次回アクション表示',
    },
    {
      href: `/properties/${id}/manager-pack`,
      title: '管理共有パック',
      text: '上司共有・社内共有向けのセットを一発で作る',
      category: '上司向け文体整形 / 月次レポート自動生成',
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/properties/${id}`}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
          >
            物件詳細へ戻る
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          物件文書センター
        </h1>

        <p className="text-sm leading-6 text-gray-600">
          {data.property.name ?? '物件'}のAI文書をまとめて使うための入口です。
          月次報告、クレーム共有、引き継ぎ、理事会準備まで、実務で刺さる順に並べています。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          >
            <div className="space-y-2">
              <div className="text-lg font-bold text-gray-900">{item.title}</div>
              <div className="text-sm leading-6 text-gray-600">{item.text}</div>
              <div className="text-xs font-medium text-gray-500">
                対応項目: {item.category}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <details className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-gray-700">
          AIに渡す物件参照データを見る
        </summary>
        <pre className="mt-4 whitespace-pre-wrap text-xs leading-6 text-gray-600">
          {snapshot}
        </pre>
      </details>
    </div>
  )
}