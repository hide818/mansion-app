import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiOppositionPrepPackPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="opposition_prep_pack"
        title="AI 反対意見準備パック"
        description="反対されそうな論点を先に並べ、返し方と着地点まで準備します。"
        inputLabel="反対されそうな内容"
        placeholder="例）工事時期、金額、業者選定、今やる必要性の4点で反対が出そうです。"
        buttonText="準備パックを作る"
        resultTitle="反対意見準備パック"
        tips={[
          '理事会の荒れ予防に向いています。',
          '防衛トークより反対意見対策寄りです。',
          '着地点の作り方まで整理できます。',
        ]}
      />
    </div>
  )
}