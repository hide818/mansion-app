import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiPriorityJudgePage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="priority_judgement"
      title="AI 優先度自動判定"
      description="案件全体の優先度を高・中・低で判定し、今週中にやるべきことまで整理します。案件の温度感をすぐ見たい時に使う機能です。"
      placeholder="特に急ぎだと感じる理由、逆に落ち着いている理由、上司からの指示などがあればここへ書いてください。"
      tips={[
        '案件全体の優先度を判定します。',
        '理由つきで出すので説明にも使えます。',
        '今週中にやることも一緒に出します。',
        '案件の温度感確認に向いています。',
      ]}
    />
  )
}