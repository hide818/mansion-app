import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiNextActionProposalPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="next_action_proposal"
        title="AI次アクション提案"
        description="今の案件を前に進めるために、次にやるべきことを順番付きで提案します。"
        inputLabel="次の一手で悩んでいること"
        placeholder="例）今日中に動くなら何を先にすべきか、明日以降は何を詰めるべきか整理したいです。"
        buttonText="次アクションを出す"
        resultTitle="AI次アクション提案"
        tips={[
          '止まっている案件の再起動に向いています。',
          '順番付きで出るとかなり使いやすいです。',
          '実務では使用頻度が高い本命機能です。',
        ]}
      />
    </div>
  )
}