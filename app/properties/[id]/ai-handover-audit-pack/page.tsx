import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiHandoverAuditPackPage({
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
      key: 'propertyHandover',
      title: '現況つき引き継ぎサマリー',
      endpoint: `/api/properties/${id}/ai-property-handover`,
      basePrompt: `${propertyName}の現況、注意点、未了事項が漏れにくい引き継ぎサマリーを作成してください。`,
    },
    {
      key: 'logSummary',
      title: '抜けがちな流れ要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}の最近の流れを、引き継ぎ時に抜けやすい点が分かるように要約してください。`,
    },
    {
      key: 'managementBrief',
      title: '注意点監査メモ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}の引き継ぎで特に漏らしてはいけない注意点を短く整理してください。`,
    },
    {
      key: 'nextActions',
      title: '引き継ぎ後初動チェック',
      endpoint: `/api/properties/${id}/ai-property-next-actions`,
      basePrompt: `${propertyName}の引き継ぎ後、すぐ確認すべきことを順番付きで整理してください。`,
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
          href={`/properties/${id}/ai-handover-exec-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          引き継ぎ実務パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI引き継ぎ監査パック"
        description={`${propertyName}の引き継ぎで漏れやすい点を先に洗い出して、監査っぽくチェックするパックです。`}
        tools={tools}
        featureList={[
          '物件単位の引き継ぎサマリー',
          '現在の状況要約',
          '注意点表示',
          '対応抜けチェック',
          'AI引き継ぎサマリー',
          'AI要約',
        ]}
        notePlaceholder="例：休暇引き継ぎではなく担当交代前提で、注意点重視、など"
      />
    </div>
  )
}