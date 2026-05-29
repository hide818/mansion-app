import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiManagerMemoPackPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getPropertyWorkbenchData(id)

  if (!data) notFound()

  const propertyName = data.property.name ?? '物件'

  const tools = [
    {
      key: 'managementBrief',
      title: '上司向けメモ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}について、上司が一読で状況をつかめる短いメモを作成してください。`,
    },
    {
      key: 'monthlyReport',
      title: '社内報告向けまとめ',
      endpoint: `/api/properties/${id}/ai-monthly-report-board`,
      basePrompt: `${propertyName}について、社内報告向けにやや整ったまとめ文を作成してください。`,
    },
    {
      key: 'logSummary',
      title: '最近の動きメモ',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}について、最近の動きを上司メモ向けに短く整理してください。`,
    },
    {
      key: 'estimateOverview',
      title: '判断論点の補足',
      endpoint: `/api/properties/${id}/ai-estimate-overview`,
      basePrompt: `${propertyName}について、上司確認が必要な見積や判断論点を短く整理してください。`,
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          物件詳細へ戻る
        </Link>
        <Link
          href={`/properties/${id}/ai-internal-report-finish-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          社内報告完成パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI上司メモパック"
        description={`${propertyName}の状況を、上司向けメモとして素早く整えるパックです。`}
        tools={tools}
        featureList={[
          '上司向け文体整形',
          'AI文書整形',
          'AI要約',
          '月次レポート自動生成',
        ]}
        notePlaceholder="例：部長向けにかなり短く、でも判断材料は残したい、など"
      />
    </div>
  )
}