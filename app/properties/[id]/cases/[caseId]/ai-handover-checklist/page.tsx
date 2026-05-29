import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiHandoverChecklistPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="handover_checklist"
        title="AI 引き継ぎチェックリスト"
        description="担当変更や休暇前の共有用に、引き継ぎ漏れを防ぐチェックリストを作ります。"
        inputLabel="引き継ぎで絶対落としたくないこと"
        placeholder="例）未返答先、次回期限、注意人物、理事会判断の要否、業者確認中の事項を落としたくないです。"
        buttonText="チェックリストを作る"
        resultTitle="引き継ぎチェックリスト"
        tips={[
          '担当変更時に強いです。',
          '抜け漏れ防止の共有メモになります。',
          '社内でそのまま回しやすい形に向いています。',
        ]}
      />
    </div>
  )
}