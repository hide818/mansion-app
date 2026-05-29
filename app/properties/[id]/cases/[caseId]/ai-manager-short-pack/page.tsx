import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiManagerShortPackPage({
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
      title: '超短い上司報告',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、上司へ一言で報告しやすい短い要約を作成してください。`,
    },
    {
      key: 'format',
      title: '送信用の整形版',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、チャットやメールで上司に送りやすい文面に整形してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '判断ポイントの補足',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、上司が判断する時のポイントを短く補足してください。`,
    },
    {
      key: 'boardExplanation',
      title: '口頭説明の補助文',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-board-explanation`,
      basePrompt: `${propertyName}の「${caseTitle}」について、上司へ口頭説明しやすい文章を作成してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-manager-check-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          上司確認パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI上司ショート報告パック"
        description={`${propertyName} / ${caseTitle} を上司へ短く素早く報告するためのパックです。`}
        tools={tools}
        featureList={[
          '上司向け文体整形',
          'AI文書整形',
          'AI要約',
          'AI対応提案',
        ]}
        notePlaceholder="例：社内チャットにそのまま送れる長さで、など"
      />
    </div>
  )
}