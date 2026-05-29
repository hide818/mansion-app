import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiStaffSharePackPage({
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
      title: '社内共有ブリーフ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}の社内共有用として、現況と注意点がすぐ伝わる短いブリーフを作成してください。`,
    },
    {
      key: 'monthlyReport',
      title: '社内共有向け月次報告',
      endpoint: `/api/properties/${id}/ai-monthly-report-board`,
      basePrompt: `${propertyName}の月次報告を、社内共有向けにやや短めで作成してください。`,
    },
    {
      key: 'logSummary',
      title: '最近の動きメモ',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}の最近の動きを、担当外の人でも追えるように短くまとめてください。`,
    },
    {
      key: 'propertyHandover',
      title: '担当外向け引き継ぎメモ',
      endpoint: `/api/properties/${id}/ai-property-handover`,
      basePrompt: `${propertyName}を担当外の社員へ共有する前提で、引き継ぎメモを分かりやすく作成してください。`,
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
          href={`/properties/${id}/ai-manager-report-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          管理共有パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI社内共有パック"
        description={`${propertyName}を社内の誰でも追いやすいように、共有文をまとめて作るパックです。`}
        tools={tools}
        featureList={[
          '上司向け文体整形',
          'AI文書整形',
          '月次レポート自動生成',
          'AI要約',
        ]}
        notePlaceholder="例：担当外メンバー向けに前提も少し入れて、など"
      />
    </div>
  )
}