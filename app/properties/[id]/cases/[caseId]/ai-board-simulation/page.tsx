import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiBoardSimulationPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="board_simulation"
        title="AI理事会シミュレーション"
        description="理事会本番を先にシミュレーションします。質問の流れ、切り返し、詰まりやすい点までまとめます。"
        inputLabel="今回の理事会で特に気になる点"
        placeholder="例）金額が高いので反発がありそうです。工事項目の違いも聞かれそうです。理事長には短く説明したいです。"
        submitLabel="シミュレーションする"
        resultTitle="理事会シミュレーション結果"
      />
    </div>
  )
}