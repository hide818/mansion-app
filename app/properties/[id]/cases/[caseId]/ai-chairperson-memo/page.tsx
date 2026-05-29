import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiChairpersonMemoPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="chairperson_memo"
        title="AI 理事長メモ"
        description="理事長の考え方、好む進め方、説明のコツ、注意点を理事長メモとして整理します。"
        inputLabel="理事長について残したいこと"
        placeholder="例）結論先出しが好き、数字に厳しい、事前共有がないと不機嫌になりやすいです。"
        buttonText="理事長メモを作る"
        resultTitle="理事長メモ"
        tips={[
          '理事長対応の属人化解消に向いています。',
          '担当変更時の価値がかなり高いです。',
          '理事会前の準備にも効きます。',
        ]}
      />
    </div>
  )
}