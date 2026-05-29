import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiBoardOperationMemoPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="board_operation_memo"
        title="AI 理事会運営メモ"
        description="理事会の進め方、揉めやすい点、通しやすい説明の仕方など、運営上のコツを整理します。"
        inputLabel="理事会運営で残したいこと"
        placeholder="例）理事長は先に要点が必要、役員は金額比較を重視、長い説明は嫌われやすいです。"
        buttonText="運営メモを作る"
        resultTitle="理事会運営メモ"
        tips={[
          '理事会のクセを残す用途です。',
          '新担当が運営事故を起こしにくくなります。',
          '属人化解消にかなり強いです。',
        ]}
      />
    </div>
  )
}