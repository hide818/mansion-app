import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiIncidentFirstPackPage({
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
      key: 'complaintActions',
      title: '事故初動アクション',
      endpoint: `/api/properties/${id}/ai-complaint-actions`,
      basePrompt: `${propertyName}で緊急性のあるトラブルが起きた前提で、最初に打つべき初動アクションを実務順で提案してください。`,
    },
    {
      key: 'complaintBrief',
      title: '初動共有メモ',
      endpoint: `/api/properties/${id}/ai-complaint-brief`,
      basePrompt: `${propertyName}で事故や緊急トラブルが起きた時に、社内共有用として使いやすい初動メモを作成してください。`,
    },
    {
      key: 'managementBrief',
      title: '上司報告の短文',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}で緊急トラブルが起きた時に上司へすぐ送れる短文を作成してください。`,
    },
    {
      key: 'logSummary',
      title: '初動記録の整理',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}で起きた緊急トラブルについて、初動の流れを記録しやすいように整理してください。`,
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
          href={`/properties/${id}/ai-complaint-response-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          クレーム対応パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI事故初動パック"
        description={`${propertyName}で急ぎの事故・トラブルが出た時に、最初の動きと共有文をすぐ出すパックです。`}
        tools={tools}
        featureList={[
          '注意メッセージ表示',
          'AIによる判断補助',
          'クレーム対応履歴の蓄積',
          'AI対応提案',
          'AIクレーム要約',
        ]}
        notePlaceholder="例：夜間想定、管理人経由の報告、住民への説明はまだ控えめ、など"
      />
    </div>
  )
}