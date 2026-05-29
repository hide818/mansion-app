import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiManagerReportPackPage({
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
      key: 'summary',
      title: '案件要約',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、上司共有向けの短い案件要約を作成してください。`,
    },
    {
      key: 'format',
      title: '上司向け文体整形',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、上司共有でそのまま使える整った文体にしてください。`,
    },
    {
      key: 'boardExplanation',
      title: '説明文補助',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-board-explanation`,
      basePrompt: `${propertyName}の「${caseTitle}」について、上司へ状況説明しやすい文章を作成してください。`,
    },
    {
      key: 'estimateComment',
      title: '見積論点コメント',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-estimate-comment`,
      basePrompt: `${propertyName}の「${caseTitle}」について、上司確認時に使える見積論点コメントを作成してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-manager-brief-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          管理共有パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI上司報告パック"
        description={`${propertyName} / ${caseTitle} を上司へ短く正確に報告しやすくするパックです。`}
        tools={tools}
        featureList={[
          '上司向け文体整形',
          'AI要約',
          'AI文書整形',
          'AI見積比較コメント生成',
        ]}
        notePlaceholder="例：部長向けにかなり短く、でも判断材料は残して、など"
      />
    </div>
  )
}