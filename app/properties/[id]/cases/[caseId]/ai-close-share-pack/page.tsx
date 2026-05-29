import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiCloseSharePackPage({
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
      title: '完了共有用の要約',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、完了共有向けに短く分かりやすい要約を作成してください。`,
    },
    {
      key: 'minutes',
      title: '記録保存向け文面',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-minutes`,
      basePrompt: `${propertyName}の「${caseTitle}」について、記録や保存に向いた文章を作成してください。`,
    },
    {
      key: 'caseHandover',
      title: '後日見返し用引き継ぎメモ',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-case-handover`,
      basePrompt: `${propertyName}の「${caseTitle}」について、後日見返す用の案件引き継ぎメモを作成してください。`,
    },
    {
      key: 'format',
      title: '保存・共有向け整形',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、保存用・社内共有用に見やすい文面へ整形してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-closeout-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          完了・引き継ぎパックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI完了共有パック"
        description={`${propertyName} / ${caseTitle} の完了共有、保存、後日見返し用メモをまとめて整えるパックです。`}
        tools={tools}
        featureList={[
          '案件単位の引き継ぎサマリー',
          'AI議事録生成',
          'AI文書整形',
          'AI要約',
        ]}
        notePlaceholder="例：次回同じ案件が起きた時に使いやすい形で残したい、など"
      />
    </div>
  )
}