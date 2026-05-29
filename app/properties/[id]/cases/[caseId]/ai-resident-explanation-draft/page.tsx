import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiResidentExplanationDraftPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="resident_explanation_draft"
        title="AI 居住者説明ドラフト"
        description="居住者向けに、やわらかく分かりやすい説明文を作ります。"
        inputLabel="住民へどう伝えたいか"
        placeholder="例）不安を煽らずに、現状と今後の予定を分かりやすく伝えたいです。強すぎる表現は避けたいです。"
        buttonText="説明文を作る"
        resultTitle="居住者説明ドラフト"
        tips={[
          '住民向けの説明文に向いています。',
          '難しい内部事情を噛み砕いて出せます。',
          'クレーム予防の初動文にも使えます。',
        ]}
      />
    </div>
  )
}