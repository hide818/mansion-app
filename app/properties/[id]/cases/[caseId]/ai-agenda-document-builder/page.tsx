import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiAgendaDocumentBuilderPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="agenda_document_builder"
        title="AI 議案書作成機能"
        description="理事会に出す議案書として、背景・現状・提案内容・判断ポイントを整理した文案を作ります。"
        inputLabel="議案書で強く出したい点"
        placeholder="例）なぜ今この議案が必要か、何を承認してほしいか、比較材料は何かを明確にしたいです。"
        buttonText="議案書を作る"
        resultTitle="議案書ドラフト"
        tips={[
          '理事会資料のたたき台に向いています。',
          '議案としての形に整えやすいです。',
          '決めてほしいことを明確にしやすいです。',
        ]}
      />
    </div>
  )
}