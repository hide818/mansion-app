import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiBoardExplanationScriptPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="board_explanation_script"
        title="AI理事会説明文生成"
        description="理事会で口頭説明しやすいように、読み上げやすい自然な説明文を生成します。"
        inputLabel="説明時の希望"
        placeholder="例）難しい言い回しは避けたいです。3分以内で説明できる長さにしたいです。理事長向けに柔らかめでお願いします。"
        submitLabel="説明文を作る"
        resultTitle="理事会説明文"
      />
    </div>
  )
}