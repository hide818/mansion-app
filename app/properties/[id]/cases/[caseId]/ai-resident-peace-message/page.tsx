import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiResidentPeaceMessagePage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="resident_peace_message"
        title="AI 住民不満やわらげ文"
        description="住民の不満を無駄に刺激せず、でも逃げすぎない説明文を作ります。"
        inputLabel="住民対応で困っていること"
        placeholder="例）不満は強いですが、今すぐ全部は解決できません。まずは落ち着いてもらえる文にしたいです。"
        buttonText="やわらげ文を作る"
        resultTitle="住民不満やわらげ文"
        tips={[
          'クレーム予防の文章づくりに向いています。',
          '居住者返信ドラフトより感情配慮寄りです。',
          '電話後のフォロー文にも使えます。',
        ]}
      />
    </div>
  )
}