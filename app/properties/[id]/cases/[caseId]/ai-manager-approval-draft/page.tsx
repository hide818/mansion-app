import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiManagerApprovalDraftPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="manager_approval_draft"
        title="AI 上司承認依頼文"
        description="上司に判断や承認を取りたい時の依頼文を、結論先出しで作ります。"
        inputLabel="承認を取りたい内容"
        placeholder="例）理事会提出前に社内承認を取りたいです。金額、理由、急ぎ度が分かる文にしたいです。"
        buttonText="承認依頼文を作る"
        resultTitle="上司承認依頼文"
        tips={[
          '社内承認のスピードを上げたい時に向いています。',
          '長文になりすぎず、判断材料が見える文に寄せられます。',
          'チャットでもメールでも使いやすいです。',
        ]}
      />
    </div>
  )
}