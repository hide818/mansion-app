import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiVendorNegotiationPackPage({
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
      title: '交渉用の文面',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-vendor-request`,
      basePrompt: `${propertyName}の「${caseTitle}」について、業者との交渉や再確認に使える文面を作成してください。`,
    },
    {
      key: 'estimateComment',
      title: '交渉論点の整理',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-estimate-comment`,
      basePrompt: `${propertyName}の「${caseTitle}」について、価格や内容の交渉で使える論点を整理してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '交渉の進め方',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、業者交渉をどう進めるべきか方針を提案してください。`,
    },
    {
      key: 'format',
      title: '送信前の整形版',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、交渉文をそのまま送れるように整形してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-vendor-compare-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          業者比較パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI業者交渉パック"
        description={`${propertyName} / ${caseTitle} の業者交渉、確認、文面整形を一気に整えるパックです。`}
        tools={tools}
        featureList={[
          'ワンクリック業者依頼文',
          '見積比較コメント生成',
          'AI見積比較コメント生成',
          'AI対応提案',
          'AI文書整形',
        ]}
        notePlaceholder="例：強く出すぎず、でも譲れない条件は残したい、など"
      />
    </div>
  )
}