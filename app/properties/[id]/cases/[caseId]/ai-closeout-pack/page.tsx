import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiCloseoutPackPage({
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
      title: '完了前の案件要約',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、完了前の総まとめとして短い案件要約を作成してください。`,
    },
    {
      key: 'minutes',
      title: '議事録・記録向け文章',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-minutes`,
      basePrompt: `${propertyName}の「${caseTitle}」について、記録として残しやすい文章を作成してください。`,
    },
    {
      key: 'caseHandover',
      title: '引き継ぎサマリー',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-case-handover`,
      basePrompt: `${propertyName}の「${caseTitle}」について、後任や将来の見返し用に案件引き継ぎサマリーを作成してください。`,
    },
    {
      key: 'format',
      title: '保存用文面整形',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、保存用・共有用として見やすい文章へ整形してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-handover-decision-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          引き継ぎ判断パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI完了・引き継ぎパック"
        description={`${propertyName} / ${caseTitle} の完了整理、記録保存、引き継ぎまでまとめて整えるパックです。`}
        tools={tools}
        featureList={[
          '案件単位の引き継ぎサマリー',
          'AI議事録生成',
          'AI文書整形',
          'AI要約',
        ]}
        notePlaceholder="例：次に同じ案件が起きたとき見返しやすい形で、など"
      />
    </div>
  )
}