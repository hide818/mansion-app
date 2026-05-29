import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiEstimateJudgementPackPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params
  const data = await getCaseWorkbenchData(id, caseId)

  if (!data) notFound()

  const propertyName = data.property.name ?? '物件'
  const caseTitle = data.caseRow.title ?? '案件'

  const tools = [
    {
      key: 'estimateComment',
      title: '見積比較コメント',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-estimate-comment`,
      basePrompt: `${propertyName}の「${caseTitle}」について、見積比較時に使いやすいコメント案を作成してください。`,
    },
    {
      key: 'similarCases',
      title: '類似案件の示唆',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-similar-cases`,
      basePrompt: `${propertyName}の「${caseTitle}」について、判断の参考になる類似案件の観点を出してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '見積判断の対応提案',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、見積判断後の現実的な対応方針を提案してください。`,
    },
    {
      key: 'vendorRequest',
      title: '業者確認文の叩き台',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-vendor-request`,
      basePrompt: `${propertyName}の「${caseTitle}」について、見積確認や再見積依頼で使える業者向け文面を作成してください。`,
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}/cases/${caseId}`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          案件詳細へ戻る
        </Link>
        <Link
          href={`/properties/${id}/cases/${caseId}/ai-vendor-decision-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          業者判断パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI見積判断パック"
        description={`${propertyName} / ${caseTitle} の見積比較、業者確認、次対応を一気に整えるパックです。`}
        tools={tools}
        featureList={[
          'AI見積比較コメント生成',
          'AI類似案件提案',
          'ワンクリック業者依頼文',
          'AI対応提案',
        ]}
        notePlaceholder="例：価格だけでなく施工内容の差も見たい、など"
      />
    </div>
  )
}