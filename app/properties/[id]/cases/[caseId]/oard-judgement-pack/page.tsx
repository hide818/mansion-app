import Link from 'next/link'
import { notFound } from 'next/navigation'
import GeneratedSectionCard from '@/app/components/GeneratedSectionCard'
import {
  buildBoardJudgementMemo,
  buildBoardSubmissionChecklist,
  getCaseDocumentBaseData,
} from '@/lib/caseDocumentData'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function BoardJudgementPackPage({ params }: PageProps) {
  const { id, caseId } = await params

  const data = await getCaseDocumentBaseData({
    propertyId: id,
    caseId,
  })

  if (!data) {
    notFound()
  }

  const judgementText = buildBoardJudgementMemo(data)
  const checklistText = buildBoardSubmissionChecklist(data)

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
          href={`/properties/${id}/cases/${caseId}/risk-temperature-pack`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          リスク判定へ
        </Link>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <p className="text-sm font-semibold text-blue-900">
          対応機能：
          理事会提出推奨アラート / 理事会提出推奨アラート / おすすめアクション表示
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          理事会提出判断パック
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          この案件を理事会に上げるべきか、まだ実務で持つべきかを判断しやすくします。
        </p>
      </div>

      <GeneratedSectionCard title="理事会提出判断メモ" text={judgementText} />
      <GeneratedSectionCard title="理事会提出前チェック" text={checklistText} />
    </div>
  )
}