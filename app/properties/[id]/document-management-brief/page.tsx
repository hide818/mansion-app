import Link from 'next/link'
import { notFound } from 'next/navigation'
import PropertyAiToolClient from '@/app/components/PropertyAiToolClient'
import {
  buildPropertySnapshotText,
  getPropertySupportData,
} from '@/lib/propertySupportData'

export default async function PropertyDocumentManagementBriefPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getPropertySupportData(id)

  if (!data) notFound()

  const snapshot = buildPropertySnapshotText(data)

  const defaultPrompt = [
    'あなたはマンション管理会社の実務責任者です。',
    '次の物件情報をもとに、上司や社内へ共有するための管理共有ブリーフを作成してください。',
    '短すぎず長すぎず、重要度の高い点を優先して整理してください。',
    '文章は、現況、気を付ける点、判断が必要な点、次に取るべき動きが自然に伝わる形にしてください。',
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
        title="物件管理共有ブリーフ"
        description="社内共有・上司共有で使いやすい、判断付きの短いブリーフを作ります。"
        endpoint={`/api/properties/${id}/ai-management-brief`}
        defaultPrompt={defaultPrompt}
        outputTitle="管理共有ブリーフ"
        notePlaceholder="例：部長報告向けに短め、社内会議向けに少し詳しく、など"
        bullets={[
          '重要な論点を先に出す',
          '社内で判断が必要な点を分かる形にする',
          'そのまま共有しやすい文体にする',
        ]}
      />
    </div>
  )
}