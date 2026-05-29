import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiManagementMemoPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="management_memo"
        title="AI 管理メモ"
        description="この物件・案件で管理会社として押さえるべき管理メモを、実務向けに整理します。"
        inputLabel="管理メモに残したいこと"
        placeholder="例）理事会の雰囲気、業者選定の傾向、管理上の注意点を残したいです。"
        buttonText="管理メモを作る"
        resultTitle="管理メモ"
        tips={[
          '担当者の頭の中をメモ化する方向です。',
          '物件攻略本の土台になるAIです。',
          '引き継ぎ時にかなり効きます。',
        ]}
      />
    </div>
  )
}