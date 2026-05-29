import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiResidentNoticePackPage({
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
      key: 'boardExplanation',
      title: '住民通知の叩き台',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-board-explanation`,
      basePrompt: `${propertyName}の「${caseTitle}」について、住民通知や掲示で使いやすい説明文を作成してください。`,
    },
    {
      key: 'format',
      title: '掲示向け整形',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、掲示や配布向けに読みやすく整形してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '問い合わせ時の対応方針',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、住民から問い合わせが来た時の対応方針を提案してください。`,
    },
    {
      key: 'summary',
      title: '一言要約',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、まず短く全体像が伝わる一言要約を作成してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-resident-explanation-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          居住者説明パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI住民通知パック"
        description={`${propertyName} / ${caseTitle} の住民通知・掲示・問い合わせ対応を整えるパックです。`}
        tools={tools}
        featureList={[
          'コピペ用テキスト出力',
          'AI文書整形',
          'AI対応提案',
          'AI理事会説明文生成',
        ]}
        notePlaceholder="例：専門用語を減らして、掲示で読まれやすい長さで、など"
      />
    </div>
  )
}