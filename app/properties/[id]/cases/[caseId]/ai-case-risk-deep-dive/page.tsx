import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiCaseRiskDeepDivePage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="case_risk_deep_dive"
        title="案件リスク深掘り"
        description="案件の火種、悪化シナリオ、炎上ポイント、先回り策まで深掘りします。"
        inputLabel="特に気になるリスク"
        placeholder="例）理事会で反対が出る可能性、見積の説明不足、居住者対応の不満、工期遅延のリスクが気になります。"
        submitLabel="リスクを深掘りする"
        resultTitle="案件リスク深掘り結果"
      />
    </div>
  )
}