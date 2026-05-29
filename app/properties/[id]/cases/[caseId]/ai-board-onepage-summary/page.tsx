import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiBoardOnepageSummaryPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="board_onepage_summary"
        title="AI 理事会一枚要約"
        description="理事会提出前に、背景・現状・判断ポイント・確認事項を一枚で掴める要約を作ります。"
        inputLabel="理事会で特に伝えたいこと"
        placeholder="例）金額の妥当性、工事項目の違い、緊急性、理事会で決めてほしい点を一枚で見たいです。"
        buttonText="一枚要約を作る"
        resultTitle="理事会一枚要約"
        tips={[
          '理事会前の整理に向いています。',
          '長い経緯を一枚感覚で圧縮します。',
          '理事長説明の前準備にも使えます。',
        ]}
      />
    </div>
  )
}