import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiFixedCautionNotePage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="fixed_caution_note"
        title="AI 注意事項の固定表示"
        description="毎回必ず見るべき注意事項を、固定表示向きの短いメモへ整理します。"
        inputLabel="固定で見せたい注意事項"
        placeholder="例）理事長への報告順、住民対応で避ける表現、工事連絡時の注意点を固定で残したいです。"
        buttonText="固定注意事項を作る"
        resultTitle="固定表示用 注意事項"
        tips={[
          '毎回見返すべき注意を短く残せます。',
          '見落としやすい運用注意に向いています。',
          '案件詳細の上部固定にも将来つなげやすいです。',
        ]}
      />
    </div>
  )
}