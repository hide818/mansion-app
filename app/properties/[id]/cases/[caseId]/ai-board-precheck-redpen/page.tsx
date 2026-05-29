import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiBoardPrecheckRedpenPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="board_precheck_redpen"
        title="AI 理事会提出前赤ペン"
        description="理事会へ出す前に、説明不足・比較不足・確認不足を赤ペン感覚で洗い出します。"
        inputLabel="提出前に不安なこと"
        placeholder="例）見積比較の説明が弱い気がします。理事長から追加質問が来そうな点も見たいです。"
        buttonText="赤ペンチェックする"
        resultTitle="理事会提出前赤ペン"
        tips={[
          '提出前の最終確認に向いています。',
          '理事会前の抜け漏れを見つけやすいです。',
          '上程前の精度上げに使えます。',
        ]}
      />
    </div>
  )
}