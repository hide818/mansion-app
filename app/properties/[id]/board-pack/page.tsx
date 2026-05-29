import Link from 'next/link'
import { notFound } from 'next/navigation'
import PropertyAiPackClient from '@/app/components/PropertyAiPackClient'
import {
  buildPropertySnapshotText,
  getPropertySupportData,
} from '@/lib/propertySupportData'

export default async function PropertyBoardPackPage({
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
      key: 'monthly',
      title: '月次報告ドラフト',
      endpoint: `/api/properties/${id}/ai-monthly-report-board`,
      prompt: [
        'あなたはマンション管理会社の担当者です。',
        '理事会や役員共有で使える月次報告ドラフトを作成してください。',
        '案件、タスク、クレーム、注意点が分かる実務文にしてください。',
        '',
        snapshot,
      ].join('\n'),
    },
    {
      key: 'boardBrief',
      title: '理事会全体ブリーフ',
      endpoint: `/api/properties/${id}/ai-board-brief`,
      prompt: [
        'あなたはマンション管理会社の担当者です。',
        '理事会前に確認する物件全体ブリーフを作成してください。',
        '今月の重要論点、理事会で押さえるべき点、注意点を中心にまとめてください。',
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
        '理事会前共有で使えるクレーム要約文を作成してください。',
        '発生傾向、現在対応、今後の注意点が分かる形にしてください。',
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
        '理事会までに押さえるべき次アクションを優先順で整理してください。',
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
        title="理事会提出パック"
        description="理事会前に欲しい文書を一気にまとめて生成します。"
        tools={tools}
        referenceText={snapshot}
        notePlaceholder="例：役員向けにやわらかく、今月の注意点を厚めに、など"
      />
    </div>
  )
}