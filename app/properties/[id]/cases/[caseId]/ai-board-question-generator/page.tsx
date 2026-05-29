import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiBoardQuestionGeneratorPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="board_question_generator"
      title="理事会想定質問生成"
      description="理事会で飛んできそうな質問を、厳しめも含めて先回り生成します。返答骨子まで一緒に出すので、説明準備がかなり楽になります。"
      inputLabel="理事会で不安なこと"
      placeholder="例：金額の妥当性、業者選定理由、工事時期、住民への影響について突っ込まれそうです。"
      buttonText="想定質問を生成する"
      resultTitle="理事会想定質問"
    />
  )
}