import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiNext7daysPlanPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="next_7days_plan"
        title="AI 7日実行プラン"
        description="この案件を1週間で前に進めるために、日別の動き方を整理します。"
        inputLabel="今週の制約や事情"
        placeholder="例）今週は理事会準備もあるので、短時間で進めたいです。優先順位付きで7日分の動きを見たいです。"
        buttonText="7日プランを作る"
        resultTitle="7日実行プラン"
        tips={[
          '今日やることの延長ではなく、1週間の実行計画を出します。',
          '停滞案件の立て直しにも向いています。',
          '上司へ今週方針を共有する時にも使えます。',
        ]}
      />
    </div>
  )
}