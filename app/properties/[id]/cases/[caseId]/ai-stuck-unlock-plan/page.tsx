import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiStuckUnlockPlanPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="stuck_unlock_plan"
        title="AI 案件詰まり解除"
        description="案件がどこで詰まっているかを見抜き、突破口を複数パターンで出します。"
        inputLabel="詰まっている感覚"
        placeholder="例）誰も明確に止めていないのに進みません。確認不足なのか、判断待ちなのかを見たいです。"
        buttonText="詰まりを解除する"
        resultTitle="案件詰まり解除プラン"
        tips={[
          '表面上は平和なのに進まない案件に向いています。',
          'ボトルネックを言語化しやすいです。',
          '別ルートの打開策も出せます。',
        ]}
      />
    </div>
  )
}