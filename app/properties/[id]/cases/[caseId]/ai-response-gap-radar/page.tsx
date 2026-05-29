import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiResponseGapRadarPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="response_gap_radar"
        title="AI 返答漏れレーダー"
        description="誰に何を返していないか、どこが連絡漏れになりそうかを洗い出します。"
        inputLabel="返答で不安な点"
        placeholder="例）理事長への経過共有、業者への追加確認、居住者への返信のどれかが抜けていそうです。"
        buttonText="返答漏れを洗い出す"
        resultTitle="返答漏れレーダー"
        tips={[
          '連絡漏れや返答漏れの発見に向いています。',
          '対応抜けチェックより連絡面に寄せたAIです。',
          'クレーム予防にも使えます。',
        ]}
      />
    </div>
  )
}