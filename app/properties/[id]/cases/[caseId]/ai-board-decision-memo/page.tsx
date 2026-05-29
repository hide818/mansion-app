import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiBoardDecisionMemoPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="board_decision_memo"
        title="AI 理事会決定事項メモ"
        description="理事会後に、何が決まって何が宿題で誰が動くかを一発で整理します。"
        inputLabel="理事会後に残したい観点"
        placeholder="例）決定事項、継続審議、宿題、次回までの担当分けをはっきり出したいです。"
        buttonText="決定事項メモを作る"
        resultTitle="理事会決定事項メモ"
        tips={[
          '理事会後の引き継ぎにかなり強いです。',
          '決定事項と未決事項を分けやすいです。',
          '社内共有メモとしてそのまま使いやすいです。',
        ]}
      />
    </div>
  )
}