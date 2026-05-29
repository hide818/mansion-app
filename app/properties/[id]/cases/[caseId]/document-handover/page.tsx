import Link from 'next/link'
import { notFound } from 'next/navigation'
import CopyGeneratedText from '@/app/components/CopyGeneratedText'
import {
  buildHandoverReport,
  getCaseDocumentBaseData,
} from '@/lib/caseDocumentData'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function DocumentHandoverPage({ params }: PageProps) {
  const { id, caseId } = await params
  const data = await getCaseDocumentBaseData({
    propertyId: id,
    caseId,
  })

  if (!data) {
    notFound()
  }

  const text = buildHandoverReport(data)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}/cases/${caseId}`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          案件詳細へ戻る
        </Link>
        <Link
          href={`/properties/${id}/handover-ai`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          物件引き継ぎAIへ
        </Link>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-semibold text-blue-900">
          対応機能：
          引き継ぎ報告書生成 / 現在の状況要約 / 未完了タスク整理表示 / 次回アクション表示
        </p>
      </div>

      <CopyGeneratedText title="案件引き継ぎ報告書" text={text} />
    </div>
  )
}