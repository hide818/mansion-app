import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiCaseDelayDetectorPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="case_delay_detector"
        title="時間がかかりすぎている案件の検知"
        description="この案件が通常より長引いていそうかを見て、長期化の理由と危険度を整理します。"
        inputLabel="長引いていると感じる理由"
        placeholder="例）何度も確認が増えていて、気づけば長期化しています。どこで時間を食っているか整理したいです。"
        buttonText="長期化を検知する"
        resultTitle="時間がかかりすぎている案件の検知"
        tips={[
          '長期案件の棚卸しに向いています。',
          '遅れの理由を説明しやすくなります。',
          'マネジメント寄りの価値も高いです。',
        ]}
      />
    </div>
  )
}