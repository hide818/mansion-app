import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiBoardQnaPackPage({
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
      key: 'expectedQuestions',
      title: '想定質問一覧',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-expected-questions`,
      basePrompt: `${propertyName}の「${caseTitle}」について、理事会で出そうな質問を整理してください。`,
    },
    {
      key: 'questionSimulation',
      title: 'Q&Aシミュレーション',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-question-simulation`,
      basePrompt: `${propertyName}の「${caseTitle}」について、質問と返答のシミュレーションを作成してください。`,
    },
    {
      key: 'boardExplanation',
      title: '説明文の補強',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-board-explanation`,
      basePrompt: `${propertyName}の「${caseTitle}」について、質問されても答えやすい説明文を作成してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '回答方針メモ',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、理事会でぶれにくい回答方針を整理してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-board-qna-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 opacity-50 pointer-events-none"
        >
          現在のページ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI理事会Q&Aパック"
        description={`${propertyName} / ${caseTitle} の理事会Q&A対策をまとめて整えるパックです。`}
        tools={tools}
        featureList={[
          '想定質問生成',
          '理事会シミュレーション',
          'AI理事会説明文生成',
          'AI対応提案',
        ]}
        notePlaceholder="例：費用と工期の質問を重めに、など"
      />
    </div>
  )
}