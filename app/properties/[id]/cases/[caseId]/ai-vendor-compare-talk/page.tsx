import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiVendorCompareTalkPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="vendor_compare_talk"
        title="AI 業者比較口頭説明"
        description="複数業者の違いを、口頭で説明しやすい順番と表現に整理します。"
        inputLabel="比較で特に伝えたいこと"
        placeholder="例）金額だけでなく保証、工事項目、安心感の違いを短く説明したいです。"
        buttonText="口頭説明を作る"
        resultTitle="業者比較口頭説明"
        tips={[
          '理事会や上司説明に向いています。',
          '比較表より口頭説明寄りです。',
          'なぜこの業者かを話しやすくなります。',
        ]}
      />
    </div>
  )
}