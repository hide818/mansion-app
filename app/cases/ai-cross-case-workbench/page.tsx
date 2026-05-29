import Link from 'next/link'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'

export default function CrossCaseAiWorkbenchPage() {
  const tools = [
    {
      key: 'allNextActions',
      title: '全案件の次アクション優先順',
      endpoint: '/api/cases/ai-cross-case-next-actions',
      basePrompt:
        '現在進行中の案件全体を見渡して、次にやるべきことを優先順で整理してください。対応漏れを防ぐ観点を強めにしてください。',
    },
    {
      key: 'stuckCases',
      title: '詰まり案件の洗い出し',
      endpoint: '/api/cases/ai-cross-case-next-actions',
      basePrompt:
        '現在進行中の案件全体を見渡して、止まり気味の案件や詰まりやすい案件を洗い出し、何を動かすべきか整理してください。',
    },
    {
      key: 'todayActions',
      title: '今日動くべき案件',
      endpoint: '/api/cases/ai-cross-case-next-actions',
      basePrompt:
        '現在進行中の案件全体を見渡して、今日動くべき案件とその理由を実務順で整理してください。',
    },
    {
      key: 'managerShare',
      title: '上司共有用の全体ブリーフ',
      endpoint: '/api/cases/ai-cross-case-next-actions',
      basePrompt:
        '現在進行中の案件全体を見渡して、上司へ共有しやすい全体ブリーフを作成してください。重要案件、遅延気味案件、次対応を簡潔に含めてください。',
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href="/cases"
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          全案件一覧へ戻る
        </Link>
        <Link
          href="/dashboard"
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          ダッシュボードへ戻る
        </Link>
      </div>

      <MultiAiPackClient
        title="案件横断AI次アクションセンター"
        description="全案件を横断して、今どこを動かすべきかを一気に整理するAIパックです。"
        tools={tools}
        featureList={[
          'AI次アクション提案',
          '案件横断AI次アクション提案',
          '次にやること自動表示',
          'おすすめアクション表示',
        ]}
        notePlaceholder="例：理事会前の案件を優先して、担当変更が近い案件を重めに、など"
      />
    </div>
  )
}