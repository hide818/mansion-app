import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiResidentCommunicationPackPage({
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
      key: 'complaintBrief',
      title: '居住者向け状況共有の叩き台',
      endpoint: `/api/properties/${id}/ai-complaint-brief`,
      basePrompt: `${propertyName}の最近のクレームや相談状況について、感情的にならず、住民共有にも流用しやすい形で整理してください。`,
    },
    {
      key: 'complaintActions',
      title: '対応方針の整理',
      endpoint: `/api/properties/${id}/ai-complaint-actions`,
      basePrompt: `${propertyName}の居住者対応について、角が立ちにくく、実務的に進めやすい対応方針を提案してください。`,
    },
    {
      key: 'managementBrief',
      title: '社内向け対応メモ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}の居住者対応について、社内共有向けの短い対応メモを作成してください。`,
    },
    {
      key: 'logSummary',
      title: '最近の流れ要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}の最近の対応ログを、居住者対応の流れが分かるように要約してください。`,
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
        title="物件AI居住者対応パック"
        description={`${propertyName}の居住者対応で、共有文・社内メモ・対応方針をまとめて整えるパックです。`}
        tools={tools}
        featureList={[
          'AIクレーム要約',
          'AI対応提案',
          'AI文書整形',
          'コピペ用テキスト出力',
        ]}
        notePlaceholder="例：やわらかい言い回しで、でも責任が曖昧になりすぎないように、など"
      />
    </div>
  )
}