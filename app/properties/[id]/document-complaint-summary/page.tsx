import Link from 'next/link'
import { notFound } from 'next/navigation'
import PropertyAiToolClient from '@/app/components/PropertyAiToolClient'
import {
  buildPropertySnapshotText,
  getPropertySupportData,
} from '@/lib/propertySupportData'

export default async function PropertyDocumentComplaintSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getPropertySupportData(id)

  if (!data) notFound()

  const snapshot = buildPropertySnapshotText(data)

  const defaultPrompt = [
    'あなたはマンション管理会社の担当者です。',
    '次の物件情報をもとに、最近のクレーム状況を共有するための文章を作成してください。',
    '感情的にならず、事実ベースで、社内共有・役員共有の両方に転用しやすい文面にしてください。',
    '発生傾向、現在の対応状況、今後の注意点が分かる構成にしてください。',
    '',
    snapshot,
  ].join('\n')

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}/document-center`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          文書センターへ戻る
        </Link>
        <Link
          href={`/properties/${id}`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          物件詳細へ戻る
        </Link>
      </div>

      <PropertyAiToolClient
        title="物件クレーム共有文書"
        description="最近のクレームを短く整理して、共有しやすい文章に落とします。"
        endpoint={`/api/properties/${id}/ai-complaint-brief`}
        defaultPrompt={defaultPrompt}
        outputTitle="クレーム共有文書"
        notePlaceholder="例：役員向けにやわらかく、再発防止を強めに、など"
        bullets={[
          '最近のクレーム傾向をひと目でつかめる形にする',
          '現在の対応状況と未解決点を整理する',
          '再発防止の観点まで落とし込む',
        ]}
      />
    </div>
  )
}