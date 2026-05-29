import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiPostBoardReportPackPage({
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
      key: 'minutes',
      title: '理事会後の記録文',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-minutes`,
      basePrompt: `${propertyName}の「${caseTitle}」について、理事会後の記録や共有に使える文章を作成してください。`,
    },
    {
      key: 'boardExplanation',
      title: '社内共有向け説明文',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-board-explanation`,
      basePrompt: `${propertyName}の「${caseTitle}」について、理事会後に社内へ共有しやすい説明文を作成してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '理事会後の次対応',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、理事会後の次対応を順番付きで整理してください。`,
    },
    {
      key: 'format',
      title: '保存用整形',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、記録保存しやすい整った文面へ整形してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-board-followup-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          理事会宿題パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI理事会後報告パック"
        description={`${propertyName} / ${caseTitle} の理事会後共有、記録保存、次対応整理をまとめるパックです。`}
        tools={tools}
        featureList={[
          '理事会議事録作成機能',
          '理事会履歴管理',
          'AI議事録生成',
          'AI理事会説明文生成',
          'AI対応提案',
        ]}
        notePlaceholder="例：理事会後すぐ社内共有したい、次回宿題も分かるように、など"
      />
    </div>
  )
}