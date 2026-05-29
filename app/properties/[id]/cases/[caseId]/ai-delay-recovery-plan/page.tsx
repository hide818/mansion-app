import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiDelayRecoveryPlanPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="delay_recovery_plan"
        title="AI 停滞脱出プラン"
        description="止まっている案件をどう再起動するか、相手別・順番付きで脱出プランを出します。"
        inputLabel="止まっている理由の仮説"
        placeholder="例）業者待ち、理事長判断待ち、社内優先度負けの3つがありそうです。"
        buttonText="脱出プランを作る"
        resultTitle="停滞脱出プラン"
        tips={[
          '長期停滞案件の再起動向けです。',
          '次の一手だけでなく順番も出しやすいです。',
          '上司説明にも使える整理文になります。',
        ]}
      />
    </div>
  )
}