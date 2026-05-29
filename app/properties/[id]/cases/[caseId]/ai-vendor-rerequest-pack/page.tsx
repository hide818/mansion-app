import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiVendorRerequestPackPage({
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
      title: '再依頼・再確認文',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-vendor-request`,
      basePrompt: `${propertyName}の「${caseTitle}」について、業者へ再依頼や再確認を出す文面を作成してください。`,
    },
    {
      key: 'estimateComment',
      title: '追加確認ポイント',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-estimate-comment`,
      basePrompt: `${propertyName}の「${caseTitle}」について、再依頼前に確認しておくべき見積ポイントを整理してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '再依頼の進め方',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、業者へ再依頼をどう進めるべきか方針を提案してください。`,
    },
    {
      key: 'format',
      title: 'そのまま送れる整形版',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、再依頼文をそのまま使いやすい形へ整形してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-vendor-rerequest-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 opacity-50 pointer-events-none"
        >
          現在のページ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI業者再依頼パック"
        description={`${propertyName} / ${caseTitle} の業者再依頼、再確認、文面整形を一気に整えるパックです。`}
        tools={tools}
        featureList={[
          'ワンクリック業者依頼文',
          '見積比較コメント生成',
          'AI見積比較コメント生成',
          'AI対応提案',
          'AI文書整形',
        ]}
        notePlaceholder="例：角が立ちすぎない、でも納期意識は出したい、など"
      />
    </div>
  )
}