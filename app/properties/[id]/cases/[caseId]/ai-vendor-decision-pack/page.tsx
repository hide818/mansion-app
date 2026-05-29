import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiVendorDecisionPackPage({
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
      key: 'vendorRequest',
      title: '業者依頼文',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-vendor-request`,
      basePrompt: `${propertyName}の「${caseTitle}」について、業者へ送る依頼文を実務で使いやすい文面で作成してください。`,
    },
    {
      key: 'estimateComment',
      title: '見積比較コメント',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-estimate-comment`,
      basePrompt: `${propertyName}の「${caseTitle}」について、見積比較時のコメント案を作成してください。`,
    },
    {
      key: 'similarCases',
      title: '類似案件の示唆',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-similar-cases`,
      basePrompt: `${propertyName}の「${caseTitle}」について、類似案件の考え方や参考になりそうな示唆を出してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '対応方針提案',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、業者判断も含めた現実的な対応方針を提案してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-center`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          案件AIセンターへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI業者判断パック"
        description={`${propertyName} / ${caseTitle} の業者依頼・見積判断・対応方針を一気に整えるパックです。`}
        tools={tools}
        featureList={[
          'ワンクリック業者依頼文',
          'AI見積比較コメント生成',
          'AI類似案件提案',
          'AI対応提案',
        ]}
        notePlaceholder="例：やや強めに確認したい、丁寧だけど急ぎ感を出したい、など"
      />
    </div>
  )
}