import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiBossSubmitPackPage({
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
      title: '部長提出ブリーフ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}の状況を、部長や上司提出向けに短くきれいに整理してください。`,
    },
    {
      key: 'monthlyReport',
      title: '提出用月次報告',
      endpoint: `/api/properties/${id}/ai-monthly-report-board`,
      basePrompt: `${propertyName}の月次報告を、上司提出向けにやや整った文体で作成してください。`,
    },
    {
      key: 'logSummary',
      title: '最近の動き要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}の最近の動きを、上司が一読で把握しやすい形で要約してください。`,
    },
    {
      key: 'estimateOverview',
      title: '見積・論点整理',
      endpoint: `/api/properties/${id}/ai-estimate-overview`,
      basePrompt: `${propertyName}の見積や判断論点を、上司提出向けに整理してください。`,
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
          href={`/properties/${id}/ai-staff-share-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          社内共有パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI上司提出パック"
        description={`${propertyName}の状況を、上司提出用に短く・整って・判断しやすい形にまとめるパックです。`}
        tools={tools}
        featureList={[
          '上司向け文体整形',
          'AI文書整形',
          '月次レポート自動生成',
          'AI月次報告生成',
          'AI要約',
        ]}
        notePlaceholder="例：役員向けではなく社内役職者向けに、簡潔だけど判断材料は残す、など"
      />
    </div>
  )
}