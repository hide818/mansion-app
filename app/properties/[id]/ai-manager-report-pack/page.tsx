import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiManagerReportPackPage({
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
      title: '管理共有ブリーフ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}の状況を、上司や社内へ共有する短いブリーフとしてまとめてください。`,
    },
    {
      key: 'monthlyReport',
      title: '月次報告ドラフト',
      endpoint: `/api/properties/${id}/ai-monthly-report-board`,
      basePrompt: `${propertyName}の月次報告ドラフトを、社内共有にも流用しやすい形で作成してください。`,
    },
    {
      key: 'logSummary',
      title: '最近のログ要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}の最近の動きを、社内共有向けに時系列が伝わる形で要約してください。`,
    },
    {
      key: 'estimateOverview',
      title: '見積関連まとめ',
      endpoint: `/api/properties/${id}/ai-estimate-overview`,
      basePrompt: `${propertyName}の見積関連の動きを、上司確認向けに簡潔に整理してください。`,
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
          href={`/properties/${id}/ai-center`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          物件AIセンターへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI管理共有パック"
        description={`${propertyName}の状況を、上司・社内共有向けに一発でまとめるパックです。`}
        tools={tools}
        featureList={[
          '上司向け文体整形',
          'AI文書整形',
          'AI月次報告生成',
          'AI要約',
        ]}
        notePlaceholder="例：部長向けに短め、社内会議向けに少し詳しく、など"
      />
    </div>
  )
}