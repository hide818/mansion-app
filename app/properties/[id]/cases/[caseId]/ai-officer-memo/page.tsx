import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiOfficerMemoPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="officer_memo"
        title="AI 役員メモ"
        description="役員ごとの反応傾向、気にする点、説明の通し方を役員メモとして整理します。"
        inputLabel="役員について残したいこと"
        placeholder="例）工事時期を気にする方、金額比較を重視する方、長文説明が苦手な方がいます。"
        buttonText="役員メモを作る"
        resultTitle="役員メモ"
        tips={[
          '役員対応の精度を上げやすいです。',
          '理事会での説明順を考える材料になります。',
          '理事長メモとセットで強いです。',
        ]}
      />
    </div>
  )
}