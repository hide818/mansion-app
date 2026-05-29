import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiEscalationPreventionPlanPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="escalation_prevention_plan"
        title="AI 炎上回避プラン"
        description="この案件が悪化しそうな流れを先読みし、炎上を避けるための先回り策を整理します。"
        inputLabel="炎上しそうだと感じる点"
        placeholder="例）理事長の不信感、住民の不満、業者回答の遅さが重なると一気に悪化しそうです。"
        buttonText="炎上回避プランを作る"
        resultTitle="炎上回避プラン"
        tips={[
          '案件温度感が高い時に向いています。',
          '悪化シナリオと先回り策を一緒に見られます。',
          '上司相談の前整理にもかなり使えます。',
        ]}
      />
    </div>
  )
}