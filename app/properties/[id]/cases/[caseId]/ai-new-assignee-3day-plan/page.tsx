import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiNewAssignee3dayPlanPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="new_assignee_3day_plan"
        title="AI 新担当3日プラン"
        description="新担当が最初の3日で案件を立て直すための動き方を日別で整理します。"
        inputLabel="3日でやりたいこと"
        placeholder="例）まず現状把握、次に関係者確認、最後に今週の方針決定まで持っていきたいです。"
        buttonText="3日プランを作る"
        resultTitle="新担当3日プラン"
        tips={[
          '担当変更後の立ち上がりに向いています。',
          '初日パックより行動計画寄りです。',
          '上司に共有する再起動プランにも使えます。',
        ]}
      />
    </div>
  )
}