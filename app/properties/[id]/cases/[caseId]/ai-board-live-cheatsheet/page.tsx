import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiBoardLiveCheatsheetPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="board_live_cheatsheet"
        title="AI 理事会当日カンペ"
        description="理事会当日に見る用の、超短い説明骨子・想定質問・返し方を一枚感覚でまとめます。"
        inputLabel="当日特に気になる点"
        placeholder="例）説明を短くしたいです。質問されそうな論点も横に置いて、当日すぐ見返せる形にしたいです。"
        buttonText="当日カンペを作る"
        resultTitle="理事会当日カンペ"
        tips={[
          '理事会本番直前にかなり向いています。',
          '30秒要約より当日の実戦用です。',
          'スマホで見返しても使いやすい形を狙えます。',
        ]}
      />
    </div>
  )
}