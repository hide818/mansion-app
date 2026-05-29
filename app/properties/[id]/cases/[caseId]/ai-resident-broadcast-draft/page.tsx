import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiResidentBroadcastDraftPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="resident_broadcast_draft"
        title="AI 住民周知一斉文"
        description="掲示、配布、メール向けに、住民へ一斉周知しやすい文章を作ります。"
        inputLabel="周知で伝えたいこと"
        placeholder="例）工事予定、注意事項、問い合わせ先、期間の4点を分かりやすく一斉周知したいです。"
        buttonText="一斉文を作る"
        resultTitle="住民周知一斉文"
        tips={[
          '掲示・回覧・一斉送信向けです。',
          '住民個別返信より周知文寄りです。',
          '情報を漏れなく載せやすいです。',
        ]}
      />
    </div>
  )
}