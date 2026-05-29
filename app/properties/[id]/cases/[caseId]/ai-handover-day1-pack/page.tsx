import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiHandoverDay1PackPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="handover_day1_pack"
        title="AI 引き継ぎ初日パック"
        description="新担当が初日に何を把握すべきかを、超実務寄りで一気に整理します。"
        inputLabel="初日に絶対落としたくないこと"
        placeholder="例）理事長との関係、今止まっている理由、今週中の締切、クレーム化しそうな点を初日で把握したいです。"
        buttonText="初日パックを作る"
        resultTitle="引き継ぎ初日パック"
        tips={[
          '新担当の初日共有に向いています。',
          '何から見ればいいかを順番付きで整理できます。',
          '担当変更直後の事故防止に強いです。',
        ]}
      />
    </div>
  )
}