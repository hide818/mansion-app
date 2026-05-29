import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiBoardSubmissionAlertPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="board_submission_alert"
      title="AI 理事会提出推奨アラート"
      description="この案件を理事会に上げるべきかどうか、理由つきで判断補助します。理事会へ持っていくタイミングを迷う時に使う機能です。"
      placeholder="理事会で気になっている論点、承認を取りたい点、逆にまだ早いと感じる理由があればここへ書いてください。"
      tips={[
        '上程すべきかを理由つきで出します。',
        '上げるなら何を論点にするかも出します。',
        'まだ上げなくてよい場合の次アクションも出します。',
        '理事会前の判断補助に向いています。',
      ]}
    />
  )
}