import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiVendorChaseDraftPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="vendor_chase_draft"
        title="AI 業者再催促ドラフト"
        description="業者へ再確認や再催促をしたい時に、強すぎず弱すぎない文面を作ります。"
        inputLabel="再催促したい内容"
        placeholder="例）見積回答が遅れています。急ぎたいですが関係を悪くしたくないです。期限感も入れたいです。"
        buttonText="再催促文を作る"
        resultTitle="業者再催促ドラフト"
        tips={[
          '返答が遅い業者への再連絡に向いています。',
          '催促と配慮のバランスを取りやすいです。',
          'メールでもチャットでも使えます。',
        ]}
      />
    </div>
  )
}