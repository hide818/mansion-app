import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiInternalReportFinishPackPage({
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
      title: '上司提出ブリーフ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}の状況を、上司へ提出しやすい短いブリーフにしてください。`,
    },
    {
      key: 'monthlyReport',
      title: '社内報告用まとめ文',
      endpoint: `/api/properties/${id}/ai-monthly-report-board`,
      basePrompt: `${propertyName}の社内報告用として、役員向けより少し実務寄りのまとめ文を作成してください。`,
    },
    {
      key: 'logSummary',
      title: '最近の動き整理',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}の最近の動きを、社内報告用に短く整理してください。`,
    },
    {
      key: 'estimateOverview',
      title: '判断論点の補足',
      endpoint: `/api/properties/${id}/ai-estimate-overview`,
      basePrompt: `${propertyName}で上司確認が必要な見積や判断論点を整理してください。`,
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
          href={`/properties/${id}/ai-boss-submit-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          上司提出パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI社内報告完成パック"
        description={`${propertyName}の社内報告、上司提出、判断補足までまとめて完成させるパックです。`}
        tools={tools}
        featureList={[
          '上司向け文体整形',
          'AI文書整形',
          '日報生成',
          'AI月次報告生成',
          'AI要約',
        ]}
        notePlaceholder="例：部長向けに短め、でも判断材料は残したい、など"
      />
    </div>
  )
}