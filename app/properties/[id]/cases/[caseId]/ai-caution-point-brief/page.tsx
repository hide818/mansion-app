import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiCautionPointBriefPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="caution_point_brief"
        title="AI 注意点整理"
        description="炎上しそうな点、誤解されやすい点、引き継ぎで絶対落としたくない注意点を整理します。"
        inputLabel="特に怖いポイント"
        placeholder="例）理事長の温度感、見積金額への反応、居住者説明不足の不満が怖いです。"
        buttonText="注意点を整理する"
        resultTitle="注意点整理"
        tips={[
          '事故りやすい論点を先に見つけます。',
          '新担当や上司に先回り共有したい時向いています。',
          '理事会前の最終確認にも使えます。',
        ]}
      />
    </div>
  )
}