import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiResidentReplyDraftPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="resident_reply_draft"
        title="居住者返信ドラフト"
        description="居住者への返信文を、丁寧で角が立ちにくく、でも曖昧すぎない形で作成します。"
        inputLabel="返信で伝えたいこと"
        placeholder="例）ご意見は受け止めつつ、現時点でできることとできないことを分けて伝えたいです。強すぎない表現でお願いします。"
        submitLabel="返信文を作る"
        resultTitle="居住者返信ドラフト"
      />
    </div>
  )
}