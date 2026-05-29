import Link from 'next/link'
import { notFound } from 'next/navigation'
import PropertyAiPackClient from '@/app/components/PropertyAiPackClient'
import {
  buildPropertySnapshotText,
  getPropertySupportData,
} from '@/lib/propertySupportData'

export default async function PropertyHandoverPackPage({
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
      key: 'handover',
      title: '引き継ぎ報告書',
      endpoint: `/api/properties/${id}/ai-property-handover`,
      prompt: [
        'あなたはマンション管理会社の担当者です。',
        '担当変更や休暇前に渡せる引き継ぎ報告書を作成してください。',
        '現在の状況、注意点、未完了事項、次にやることが自然に伝わる文章にしてください。',
        '',
        snapshot,
      ].join('\n'),
    },
    {
      key: 'logSummary',
      title: 'ログ要約文書',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      prompt: [
        'あなたはマンション管理会社の担当者です。',
        '最近の動きがすぐ分かるログ要約文を作成してください。',
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
        '引き継ぎ後すぐ着手すべき次アクションを優先順で整理してください。',
        '',
        snapshot,
      ].join('\n'),
    },
    {
      key: 'managementBrief',
      title: '管理共有ブリーフ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      prompt: [
        'あなたはマンション管理会社の担当者です。',
        '引き継ぎ相手が短時間で全体像をつかめる管理共有ブリーフを作成してください。',
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
        title="引き継ぎパック"
        description="引き継ぎで必要な文章をまとめて一気に生成します。"
        tools={tools}
        referenceText={snapshot}
        notePlaceholder="例：休暇代行向けに短め、担当変更向けに注意点多め、など"
      />
    </div>
  )
}