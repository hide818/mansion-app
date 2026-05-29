import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiCloseSummaryPackPage({
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
      title: '完了サマリー',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、完了時の全体サマリーを作成してください。`,
    },
    {
      key: 'minutes',
      title: '記録保存文',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-minutes`,
      basePrompt: `${propertyName}の「${caseTitle}」について、完了後の記録として残しやすい文章を作成してください。`,
    },
    {
      key: 'caseHandover',
      title: '完了後引き継ぎメモ',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-case-handover`,
      basePrompt: `${propertyName}の「${caseTitle}」について、完了後に見返せる引き継ぎメモを作成してください。`,
    },
    {
      key: 'format',
      title: '共有用整形版',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、社内共有しやすい形へ整形してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-complete-share-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          完了共有パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI完了サマリーパック"
        description={`${propertyName} / ${caseTitle} の完了時に、共有・保存・引き継ぎをまとめるパックです。`}
        tools={tools}
        featureList={[
          'コピペ用テキスト出力',
          'AI文書整形',
          'AI要約',
          'AI議事録生成',
        ]}
        notePlaceholder="例：社内チャットにも流せる長さで、でも記録は残したい、など"
      />
    </div>
  )
}