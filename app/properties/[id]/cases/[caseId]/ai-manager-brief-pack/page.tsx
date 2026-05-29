import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiManagerBriefPackPage({
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
      basePrompt: `${propertyName}の「${caseTitle}」について、上司共有向けに整った文体へ整形してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '対応提案',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、実務的な対応提案を短くまとめてください。`,
    },
    {
      key: 'estimateComment',
      title: '見積比較コメント',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-estimate-comment`,
      basePrompt: `${propertyName}の「${caseTitle}」について、見積比較時に使いやすいコメント案を作成してください。`,
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
        title="案件AI管理共有パック"
        description={`${propertyName} / ${caseTitle} を上司・社内共有向けに整えるパックです。`}
        tools={tools}
        featureList={[
          'AI要約',
          '上司向け文体整形',
          'AI対応提案',
          'AI見積比較コメント生成',
        ]}
        notePlaceholder="例：部長向けに短め、稟議前共有向けに少し丁寧に、など"
      />
    </div>
  )
}