import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiDeadlineNoticeDraftPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="deadline_notice_draft"
      title="AI 期限通知文生成"
      description="期限が近い時の案内や催促文を、角が立ちにくい形で作ります。"
      placeholder="いつまでの期限か、相手との関係、強めに言う必要があるかなどがあればここへ書いてください。"
      tips={[
        '件名案も一緒に出します。',
        'やわらかめと少し強めを分けて出します。',
        '催促しすぎない文に整えます。',
        '提出依頼や回答期限の連絡に向いています。',
      ]}
    />
  )
}