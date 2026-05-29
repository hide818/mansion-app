import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCaseDocumentBaseData } from '@/lib/caseDocumentData'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function DocumentCenterPage({ params }: PageProps) {
  const { id, caseId } = await params

  const data = await getCaseDocumentBaseData({
    propertyId: id,
    caseId,
  })

  if (!data) {
    notFound()
  }

  const caseTitle = data.caseItem.title ?? '案件'
  const propertyName = data.property.name ?? '物件'

  const cards = [
    {
      title: '理事会準備パック',
      description:
        '議案書ドラフト、議事録テンプレ、想定質問をまとめて確認できます。',
      href: `/properties/${id}/cases/${caseId}/board-pack`,
    },
    {
      title: '引き継ぎパック',
      description:
        '引き継ぎ報告書、一言ステータス、次アクションをまとめて出せます。',
      href: `/properties/${id}/cases/${caseId}/handover-pack`,
    },
    {
      title: '業者依頼パック',
      description:
        '見積依頼文、添付資料まとめ、見積確認メモをまとめて出せます。',
      href: `/properties/${id}/cases/${caseId}/vendor-pack`,
    },
    {
      title: '上司共有パック',
      description:
        '上司向け共有文、かんたん説明、一言ステータスをすぐ出せます。',
      href: `/properties/${id}/cases/${caseId}/manager-pack`,
    },
  ]

  const singlePages = [
    {
      label: '議案書ドラフト',
      href: `/properties/${id}/cases/${caseId}/document-agenda`,
    },
    {
      label: '理事会議事録テンプレ',
      href: `/properties/${id}/cases/${caseId}/document-minutes`,
    },
    {
      label: '引き継ぎ報告書',
      href: `/properties/${id}/cases/${caseId}/document-handover`,
    },
    {
      label: '業者依頼文',
      href: `/properties/${id}/cases/${caseId}/document-vendor-request`,
    },
    {
      label: '想定質問シート',
      href: `/properties/${id}/cases/${caseId}/document-questions`,
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}/cases/${caseId}`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          案件詳細へ戻る
        </Link>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <p className="text-sm font-semibold text-blue-900">
          対応機能：
          余計な画面遷移を減らす導線 / ワンクリック操作 / 迷わないUI / コピペ用テキスト出力
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          案件文書センター
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          物件：{propertyName}
          <br />
          案件：{caseTitle}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h2 className="text-lg font-bold text-gray-900">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {card.description}
            </p>
            <p className="mt-4 text-sm font-semibold text-blue-600">
              開く →
            </p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">単体ページへ直接移動</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {singlePages.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}