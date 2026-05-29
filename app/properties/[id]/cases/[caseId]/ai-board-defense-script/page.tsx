import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiBoardDefenseScriptPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="board_defense_script"
        title="AI 理事会防衛トーク"
        description="理事会で厳しめに突っ込まれそうな点を先回りし、返し方まで含めた防衛トークを作ります。"
        inputLabel="特に怖い質問や反発"
        placeholder="例）金額が高い、なぜ今やるのか、別業者ではだめなのか、この3点を強く聞かれそうです。"
        buttonText="防衛トークを作る"
        resultTitle="理事会防衛トーク"
        tips={[
          '理事会での切り返し準備に向いています。',
          '想定質問と返答骨子を一緒に出せます。',
          '説明が弱い部分を事前に見つけやすいです。',
        ]}
      />
    </div>
  )
}