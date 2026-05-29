import Link from 'next/link'
import { notFound } from 'next/navigation'
import GeneratedSectionCard from '@/app/components/GeneratedSectionCard'
import {
  buildEstimateCheckMemo,
  buildFileSummary,
  buildVendorRequest,
  getCaseDocumentBaseData,
} from '@/lib/caseDocumentData'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function VendorPackPage({ params }: PageProps) {
  const { id, caseId } = await params

  const data = await getCaseDocumentBaseData({
    propertyId: id,
    caseId,
  })

  if (!data) {
    notFound()
  }

  const vendorRequestText = buildVendorRequest(data)
  const fileSummaryText = buildFileSummary(data)
  const estimateCheckText = buildEstimateCheckMemo(data)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}/cases/${caseId}/document-center`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          案件文書センターへ戻る
        </Link>
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
          見積依頼文生成 / ワンクリック業者依頼文 / コピペ用テキスト出力
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          業者依頼パック
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          業者への依頼メール、添付資料まとめ、見積確認ポイントを一気に出せます。
        </p>
      </div>

      <GeneratedSectionCard title="見積・業者依頼文" text={vendorRequestText} />
      <GeneratedSectionCard title="添付資料まとめ" text={fileSummaryText} />
      <GeneratedSectionCard title="見積確認メモ" text={estimateCheckText} />
    </div>
  )
}