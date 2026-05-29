import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiResponseProposalPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="response_proposal"
        title="AI対応提案"
        description="この案件に対して、今取りうる現実的な対応案を複数パターンで提案します。"
        inputLabel="今いちばん迷っていること"
        placeholder="例）理事長へ先に共有すべきか、業者へ再確認すべきか、理事会に上げるべきか迷っています。"
        buttonText="対応提案を出す"
        resultTitle="AI対応提案"
        tips={[
          '判断に迷う案件に向いています。',
          '1案だけでなく、選択肢を見たい時に強いです。',
          '社長向けに言うと、実務の脳みそ代行です。',
        ]}
      />
    </div>
  )
}