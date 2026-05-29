import Link from 'next/link'
import { notFound } from 'next/navigation'
import GeneratedSectionCard from '@/app/components/GeneratedSectionCard'
import {
  buildRiskActionMemo,
  buildRiskTemperatureReport,
  getCaseDocumentBaseData,
} from '@/lib/caseDocumentData'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function RiskTemperaturePackPage({ params }: PageProps) {
  const { id, caseId } = await params

  const data = await getCaseDocumentBaseData({
    propertyId: id,
    caseId,
  })

  if (!data) {
    notFound()
  }

  const reportText = buildRiskTemperatureReport(data)
  const actionText = buildRiskActionMemo(data)

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
          href={`/properties/${id}/cases/${caseId}/board-judgement-pack`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          理事会提出判断へ
        </Link>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <p className="text-sm font-semibold text-blue-900">
          対応機能：
          案件リスク判定 / 案件の温度感表示 / 優先度自動判定 / 注意メッセージ表示
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          案件リスク・温度感パック
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          案件が平和か、注意か、炎上かを簡易判定し、今やるべき動きを出します。
        </p>
      </div>

      <GeneratedSectionCard title="案件リスク・温度感レポート" text={reportText} />
      <GeneratedSectionCard title="おすすめアクション" text={actionText} />
    </div>
  )
}