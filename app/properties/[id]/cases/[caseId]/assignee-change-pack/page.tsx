import Link from 'next/link'
import { notFound } from 'next/navigation'
import GeneratedSectionCard from '@/app/components/GeneratedSectionCard'
import {
  buildAssigneeChangeMemo,
  buildAssigneeFirstDayChecklist,
  getCaseDocumentBaseData,
} from '@/lib/caseDocumentData'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AssigneeChangePackPage({ params }: PageProps) {
  const { id, caseId } = await params

  const data = await getCaseDocumentBaseData({
    propertyId: id,
    caseId,
  })

  if (!data) {
    notFound()
  }

  const memoText = buildAssigneeChangeMemo(data)
  const checklistText = buildAssigneeFirstDayChecklist(data)

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
          href={`/properties/${id}/cases/${caseId}/coverage-pack`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          対応抜けチェックへ
        </Link>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <p className="text-sm font-semibold text-blue-900">
          対応機能：
          担当者変更モード / 担当変更時の専用画面 / 次回アクション表示
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          担当変更パック
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          急な引き継ぎでも、何を見て何から動けばいいかをすぐ共有できます。
        </p>
      </div>

      <GeneratedSectionCard title="担当変更メモ" text={memoText} />
      <GeneratedSectionCard title="担当変更 初日チェックリスト" text={checklistText} />
    </div>
  )
}