import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiResidentResponseMemoPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="resident_response_memo"
        title="AI 居住者対応メモ"
        description="居住者対応で気をつけるべき言い回し、火種、伝え方を整理して残します。"
        inputLabel="住民対応で残したいこと"
        placeholder="例）強く出る住民への伝え方、先に説明した方がよい事項、避けたい言い方を残したいです。"
        buttonText="居住者対応メモを作る"
        resultTitle="居住者対応メモ"
        tips={[
          '住民対応の再現性を上げる機能です。',
          'クレーム予防にも向いています。',
          '人によって対応品質がぶれにくくなります。',
        ]}
      />
    </div>
  )
}