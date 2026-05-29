import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiPostActionPackPage({
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
      key: 'responseSuggestion',
      title: '次アクション整理',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、ここから次にやるべきことを順番付きで整理してください。`,
    },
    {
      key: 'summary',
      title: '現状の短い整理',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、今の位置づけが分かる短い整理文を作成してください。`,
    },
    {
      key: 'similarCases',
      title: '参考になる進め方',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-similar-cases`,
      basePrompt: `${propertyName}の「${caseTitle}」について、次の動きの参考になる進め方を示してください。`,
    },
    {
      key: 'format',
      title: '共有しやすい整形版',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、次アクション共有に使いやすい文面へ整形してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-post-action-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 opacity-50 pointer-events-none"
        >
          現在のページ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI次アクション整理パック"
        description={`${propertyName} / ${caseTitle} の次アクションを、共有しやすい形で整理するパックです。`}
        tools={tools}
        featureList={[
          '次にやること自動表示',
          '未来のタスク自動生成',
          'AI対応提案',
          'AI要約',
        ]}
        notePlaceholder="例：今週中に動くこと重視、など"
      />
    </div>
  )
}