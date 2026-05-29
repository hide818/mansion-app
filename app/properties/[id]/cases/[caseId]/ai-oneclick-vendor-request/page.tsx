import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiOneclickVendorRequestPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="oneclick_vendor_request"
        title="AI ワンクリック業者依頼文"
        description="現地確認、再見積、追加確認など、業者へすぐ送りたい依頼文を一発で作ります。"
        inputLabel="今回業者に頼みたいこと"
        placeholder="例）現地再確認、見積再提出、保証内容の明記を急ぎでお願いしたいです。強すぎない文にしたいです。"
        buttonText="業者依頼文を作る"
        resultTitle="ワンクリック業者依頼文"
        tips={[
          'よく使う業者依頼をすばやく作れます。',
          '見積依頼文生成より汎用依頼に向いています。',
          '継続利用につながりやすい日常機能です。',
        ]}
      />
    </div>
  )
}