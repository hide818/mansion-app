import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiNextActionBriefPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="next_action_brief"
        title="AI 次回アクション整理"
        description="次に何をやるべきかを、相手別・順番付きで整理します。"
        inputLabel="今迷っていること"
        placeholder="例）先に業者へ確認するか、理事長へ共有するか、理事会に上げるかで迷っています。"
        buttonText="次アクションを出す"
        resultTitle="次回アクション整理"
        tips={[
          '案件を前に進める一手を出します。',
          '順番付きで出せるので実務で使いやすいです。',
          '止まっている案件の再起動向けです。',
        ]}
      />
    </div>
  )
}