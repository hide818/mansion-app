import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiUpdateNoticeDraftPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="update_notice_draft"
      title="AI 更新通知文生成"
      description="進捗更新や状況共有の通知文を、社内外どちらにも使いやすい形で作ります。"
      placeholder="誰に向けた通知か、どこまで共有したいか、含めたい言い回しがあればここへ書いてください。"
      tips={[
        '件名案も一緒に出します。',
        'やわらかめの言い方も出します。',
        '短め版も出します。',
        '進捗共有メールやチャットに向いています。',
      ]}
    />
  )
}