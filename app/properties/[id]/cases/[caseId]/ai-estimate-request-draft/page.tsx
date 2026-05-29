import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiEstimateRequestDraftPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="estimate_request_draft"
        title="AI 見積依頼文生成"
        description="業者へ見積依頼を出す時に、要件漏れが起きにくい依頼文を作ります。"
        inputLabel="見積依頼で入れたい条件"
        placeholder="例）現地確認の要否、保証内容、写真添付、提出期限、工期目安を依頼文に入れたいです。"
        buttonText="見積依頼文を作る"
        resultTitle="見積依頼文"
        tips={[
          '見積依頼のたたき台に向いています。',
          '業者への依頼漏れを減らせます。',
          'そのままメールに貼りやすいです。',
        ]}
      />
    </div>
  )
}