import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiVendorNegotiationScriptPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="vendor_negotiation_script"
        title="AI 業者交渉トーク"
        description="業者に再確認・再見積・条件調整をしたい時の交渉トークを作ります。"
        inputLabel="交渉で取りたい着地点"
        placeholder="例）保証内容を明確にしたいです。金額も少し下げたいですが、関係は悪くしたくないです。"
        buttonText="交渉トークを作る"
        resultTitle="業者交渉トーク"
        tips={[
          '値下げだけでなく確認交渉にも向いています。',
          '強すぎず弱すぎない言い回しを作りやすいです。',
          '電話でもメールでも使える骨子になります。',
        ]}
      />
    </div>
  )
}