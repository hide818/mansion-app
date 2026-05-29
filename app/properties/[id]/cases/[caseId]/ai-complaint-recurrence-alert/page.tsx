import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiComplaintRecurrenceAlertPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="complaint_recurrence_alert"
      title="AI クレーム再発警告"
      description="この案件と同物件のクレーム履歴から、再発しそうな論点や先回り対応を整理します。火が大きくなる前に見るための機能です。"
      placeholder="今回の相手の主張や、気になっている再発ポイントがあればここへ書いてください。"
      tips={[
        '再発リスクを理由つきで出します。',
        '先回り対応も一緒に提案します。',
        '共有しておくべき注意点も出します。',
        'クレーム履歴がある物件ほど効きます。',
      ]}
    />
  )
}