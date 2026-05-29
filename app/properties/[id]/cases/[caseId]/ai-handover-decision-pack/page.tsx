import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiHandoverDecisionPackPage({
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
      key: 'caseHandover',
      title: '案件引き継ぎサマリー',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-case-handover`,
      basePrompt: `${propertyName}の「${caseTitle}」について、担当変更時にそのまま渡せる案件引き継ぎサマリーを作成してください。`,
    },
    {
      key: 'summary',
      title: '案件要約',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、短時間で全体像が分かる要約を作成してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '今後の対応提案',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、引き継ぎ後に迷いにくい対応提案を出してください。`,
    },
    {
      key: 'similarCases',
      title: '類似案件の示唆',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-similar-cases`,
      basePrompt: `${propertyName}の「${caseTitle}」について、類似案件の見方や注意点を短く出してください。`,
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
          href={`/properties/${id}/cases/${caseId}/assignee-handoff`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          担当変更モードへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI引き継ぎ判断パック"
        description={`${propertyName} / ${caseTitle} の引き継ぎ・判断材料・次対応をまとめるパックです。`}
        tools={tools}
        featureList={[
          '案件単位のAI引き継ぎサマリー',
          '担当変更時の専用画面',
          'AI要約',
          'AI対応提案',
        ]}
        notePlaceholder="例：引き継ぎ相手が初見なので前提も厚めに、など"
      />
    </div>
  )
}