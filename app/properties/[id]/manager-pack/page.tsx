import Link from 'next/link'
import { notFound } from 'next/navigation'
import PropertyAiPackClient from '@/app/components/PropertyAiPackClient'
import {
  buildPropertySnapshotText,
  getPropertySupportData,
} from '@/lib/propertySupportData'

export default async function PropertyManagerPackPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getPropertySupportData(id)

  if (!data) notFound()

  const snapshot = buildPropertySnapshotText(data)

  const tools = [
    {
      key: 'managementBrief',
      title: '管理共有ブリーフ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      prompt: [
        'あなたはマンション管理会社の担当者です。',
        '上司や社内へ共有するための短い管理共有ブリーフを作成してください。',
        '重要論点を先に出し、判断や確認が必要な点も含めてください。',
        '',
        snapshot,
      ].join('\n'),
    },
    {
      key: 'monthly',
      title: '月次報告ドラフト',
      endpoint: `/api/properties/${id}/ai-monthly-report-board`,
      prompt: [
        'あなたはマンション管理会社の担当者です。',
        '上司共有にも流用しやすい月次報告ドラフトを作成してください。',
        '',
        snapshot,
      ].join('\n'),
    },
    {
      key: 'complaint',
      title: 'クレーム共有文書',
      endpoint: `/api/properties/${id}/ai-complaint-brief`,
      prompt: [
        'あなたはマンション管理会社の担当者です。',
        '最近のクレーム状況を短く整理し、上司共有向けに使いやすい文章にしてください。',
        '',
        snapshot,
      ].join('\n'),
    },
    {
      key: 'nextActions',
      title: '次アクション整理',
      endpoint: `/api/properties/${id}/ai-property-next-actions`,
      prompt: [
        'あなたはマンション管理会社の担当者です。',
        '上司が見たときに、次に何をすべきかがすぐ分かる文章を作成してください。',
        '',
        snapshot,
      ].join('\n'),
    },
  ]

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

      <PropertyAiPackClient
        title="管理共有パック"
        description="上司共有・社内共有で使いやすい文書セットを一気に生成します。"
        tools={tools}
        referenceText={snapshot}
        notePlaceholder="例：部長向けに短め、会議用に少し詳しく、など"
      />
    </div>
  )
}