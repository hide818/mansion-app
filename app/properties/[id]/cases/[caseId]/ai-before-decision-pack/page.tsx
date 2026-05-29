import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiBeforeDecisionPackPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="before_decision_pack"
        title="AI 決定前確認パック"
        description="何かを決める前に、確認漏れ・比較漏れ・説明漏れがないかを一気に整理します。"
        inputLabel="決める前に不安なこと"
        placeholder="例）理事会に出す前に、追加確認が必要か、比較材料が足りているか、住民説明が要るかをまとめて見たいです。"
        buttonText="確認パックを作る"
        resultTitle="決定前確認パック"
        tips={[
          '決定前の最終チェック向けです。',
          '判断補助と抜け漏れ防止を一緒に見られます。',
          '理事会提出前にも上司相談前にも使えます。',
        ]}
      />
    </div>
  )
}