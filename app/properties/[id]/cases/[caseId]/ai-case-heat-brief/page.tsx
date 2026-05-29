import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiCaseHeatBriefPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="case_heat_brief"
        title="AI 案件温度感ヒート判定"
        description="この案件が平和・注意・炎上のどこにいるかを判定し、温度感の理由まで出します。"
        inputLabel="温度感で不安なこと"
        placeholder="例）まだ表面上は静かですが、理事長の不信感と業者回答の遅れが重なると危なそうです。"
        buttonText="温度感を判定する"
        resultTitle="案件温度感ヒート判定"
        tips={[
          '案件の空気感を見える化できます。',
          'リスク深掘りより、今の危険度把握に向いています。',
          '上司相談の入口にも使いやすいです。',
        ]}
      />
    </div>
  )
}