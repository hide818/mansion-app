import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiCaseRiskJudgePage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="case_risk_judge"
        title="案件リスク判定"
        description="この案件のリスクを総合判定し、何が危ないのか、どこを先回りすべきかを整理します。"
        inputLabel="気になっているリスク"
        placeholder="例）理事会で揉める可能性、住民不満、業者対応の遅れ、説明不足の4点が気になります。"
        buttonText="リスク判定する"
        resultTitle="案件リスク判定"
        tips={[
          '案件の危険度をまとめて見たい時に向いています。',
          '温度感判定より、理由と対策に寄せています。',
          '上司相談前の整理にもかなり使えます。',
        ]}
      />
    </div>
  )
}