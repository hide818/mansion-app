import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiStaleUpdateAlertPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="stale_update_alert"
      title="AI 長期未更新案件アラート"
      description="最近のログ・タスク・資料の動きから、この案件が止まり気味かどうかを見立てます。放置事故を減らすための機能です。"
      placeholder="最近止まっている気がする理由や、相手から反応がない点などがあればここに書いてください。"
      tips={[
        '最近の活動日をもとに停滞感を見ます。',
        '今やるべき1手も出します。',
        '放置すると起きそうなことも示します。',
        '長引き案件の点検に向いています。',
      ]}
    />
  )
}