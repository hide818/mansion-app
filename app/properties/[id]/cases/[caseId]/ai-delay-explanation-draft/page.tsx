import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiDelayExplanationDraftPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="delay_explanation_draft"
        title="AI 遅延説明ドラフト"
        description="遅れが出ている案件について、言い訳っぽくなりすぎない説明文を作ります。"
        inputLabel="遅れについて伝えたいこと"
        placeholder="例）業者回答待ちで遅れています。相手を刺激しすぎず、現状と次の見込みを伝えたいです。"
        buttonText="遅延説明文を作る"
        resultTitle="遅延説明ドラフト"
        tips={[
          '進捗遅れの説明に向いています。',
          '相手別にトーンを変える材料にもなります。',
          '理事長・上司・住民向けのたたき台に使えます。',
        ]}
      />
    </div>
  )
}