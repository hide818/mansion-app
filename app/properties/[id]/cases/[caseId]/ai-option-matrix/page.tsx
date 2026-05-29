import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiOptionMatrixPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="option_matrix"
        title="AI 選択肢比較マトリクス"
        description="この案件の取りうる選択肢を並べて、メリット・デメリット・向いている場面を整理します。"
        inputLabel="比較したい選択肢"
        placeholder="例）理事会に上げる、現場調整で進める、追加見積を取る、この3案で迷っています。"
        buttonText="比較マトリクスを作る"
        resultTitle="選択肢比較マトリクス"
        tips={[
          '判断に迷う案件でかなり使えます。',
          '理事会説明前の整理にも向いています。',
          '単なる要約ではなく比較で見せるAIです。',
        ]}
      />
    </div>
  )
}