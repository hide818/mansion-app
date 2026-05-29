import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiVendorFollowPackPage({
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
      title: '催促・確認用の業者文面',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-vendor-request`,
      basePrompt: `${propertyName}の「${caseTitle}」について、業者へ進捗確認や催促をする文面を、角が立ちすぎないように作成してください。`,
    },
    {
      key: 'estimateComment',
      title: '再確認ポイント整理',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-estimate-comment`,
      basePrompt: `${propertyName}の「${caseTitle}」について、業者へ再確認すべき見積・内容のポイントを整理してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '追客方針の提案',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、業者追客をどう進めるべきか現実的な方針を提案してください。`,
    },
    {
      key: 'format',
      title: 'そのまま送れる文面整形',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、社内確認後すぐ送れるように整った文面へ整形してください。`,
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
        title="案件AI業者追客パック"
        description={`${propertyName} / ${caseTitle} の業者追客、確認、再送、催促を進めやすくするパックです。`}
        tools={tools}
        featureList={[
          'ワンクリック業者依頼文',
          '見積比較コメント生成',
          'AI対応提案',
          'AI文書整形',
        ]}
        notePlaceholder="例：強すぎない催促で、でも急ぎ感は出したい、など"
      />
    </div>
  )
}