import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiRecurrencePreventPackPage({
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
      key: 'similarCases',
      title: '類似案件の再発防止観点',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-similar-cases`,
      basePrompt: `${propertyName}の「${caseTitle}」について、類似案件から見た再発防止の観点を出してください。`,
    },
    {
      key: 'summary',
      title: '今回の原因整理',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、今回の原因や背景が分かるように短く整理してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '再発防止アクション',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、再発しないための現実的なアクションを提案してください。`,
    },
    {
      key: 'format',
      title: 'ナレッジ保存向け整形',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、後でナレッジとして見返しやすい文面へ整形してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-close-share-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          完了共有パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI再発防止パック"
        description={`${propertyName} / ${caseTitle} を、次に同じ失敗を繰り返さないためのナレッジへ変えるパックです。`}
        tools={tools}
        featureList={[
          '過去類似クレーム表示',
          'クレーム対応履歴の蓄積',
          '過去の成功対応パターン表示',
          'AI類似案件提案',
          'AI対応提案',
          'AI要約',
        ]}
        notePlaceholder="例：再発防止だけに絞って、担当者が変わっても使える形で、など"
      />
    </div>
  )
}