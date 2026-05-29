import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiPropertyHealthScorePage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="property_health_score"
        title="AI 物件健康診断スコア"
        description="案件・クレーム・対応履歴の文脈から、この物件の健康状態をスコア感覚で整理する診断AIです。"
        inputLabel="診断で見たいこと"
        placeholder="例）クレームの増え方、理事会の荒れやすさ、対応の停滞感を踏まえて物件の危なさを見たいです。"
        buttonText="健康診断する"
        resultTitle="物件健康診断スコア"
        tips={[
          '数字っぽく見せやすい革新枠です。',
          'マネジメント向けの見せ方とも相性が良いです。',
          '将来のダッシュボード強化にもつながります。',
        ]}
      />
    </div>
  )
}