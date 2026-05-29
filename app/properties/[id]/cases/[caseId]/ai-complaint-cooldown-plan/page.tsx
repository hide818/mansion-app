import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiComplaintCooldownPlanPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="complaint_cooldown_plan"
        title="AI クレーム再燃防止プラン"
        description="いったん落ち着いたクレームがまた燃えないように、再燃防止の動き方を整理します。"
        inputLabel="再燃しそうな要素"
        placeholder="例）表面上は落ち着いていますが、対応の遅さと説明不足でまた不満が出そうです。"
        buttonText="再燃防止プランを作る"
        resultTitle="クレーム再燃防止プラン"
        tips={[
          'クレームの後処理に向いています。',
          '再発警告よりも、再燃防止の行動整理寄りです。',
          '住民・理事会・社内の動きを分けて考えられます。',
        ]}
      />
    </div>
  )
}