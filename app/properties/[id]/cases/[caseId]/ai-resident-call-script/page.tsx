import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiResidentCallScriptPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="resident_call_script"
        title="AI 居住者電話説明台本"
        description="電話で説明する時に、言う順番・柔らかい表現・言い切りすぎない言い回しを整えます。"
        inputLabel="電話で伝えたいこと"
        placeholder="例）苦情に対して現状報告をしたいです。感情を逆なでしない話し方にしたいです。"
        buttonText="電話台本を作る"
        resultTitle="居住者電話説明台本"
        tips={[
          '電話が苦手でも話しやすくなります。',
          '言う順番が整うので説明事故が減りやすいです。',
          'クレーム初動にも向いています。',
        ]}
      />
    </div>
  )
}