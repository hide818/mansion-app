import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiVendorRequestDraftPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="vendor_request_draft"
        title="業者依頼文ドラフト"
        description="業者への依頼文や見積依頼文を、要件漏れしにくい形で作成します。"
        inputLabel="今回依頼したい内容"
        placeholder="例）現地確認、見積提出、保証内容明記、工期目安、写真添付の有無まで依頼文に含めたいです。"
        submitLabel="依頼文を作る"
        resultTitle="業者依頼文ドラフト"
      />
    </div>
  )
}