import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiVendorComparePackPage({
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
      title: '比較コメント',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-estimate-comment`,
      basePrompt: `${propertyName}の「${caseTitle}」について、業者比較や見積比較で使いやすいコメントを作成してください。`,
    },
    {
      key: 'similarCases',
      title: '比較時の参考観点',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-similar-cases`,
      basePrompt: `${propertyName}の「${caseTitle}」について、類似案件から見た比較の参考観点を出してください。`,
    },
    {
      key: 'vendorRequest',
      title: '比較後の確認文',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-vendor-request`,
      basePrompt: `${propertyName}の「${caseTitle}」について、業者へ比較後の追加確認を送る文面を作成してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '選定方針の提案',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、業者選定の考え方と次対応を提案してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-estimate-judgement-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          見積判断パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI業者比較パック"
        description={`${propertyName} / ${caseTitle} の業者比較、確認、選定判断を整えるパックです。`}
        tools={tools}
        featureList={[
          '見積比較コメント生成',
          'ワンクリック業者依頼文',
          'AI見積比較コメント生成',
          'AI類似案件提案',
        ]}
        notePlaceholder="例：金額だけでなく対応力も見たい、理事会説明も意識、など"
      />
    </div>
  )
}