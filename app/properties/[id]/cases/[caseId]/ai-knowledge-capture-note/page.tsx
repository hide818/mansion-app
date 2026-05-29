import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiKnowledgeCaptureNotePage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="knowledge_capture_note"
      title="AI ナレッジ蓄積メモ"
      description="案件から再利用できる知見を、保存しやすい形のナレッジメモへ整理します。"
      placeholder="残しておきたい学び、次に同じ案件が来た時に見返したい点があればここへ書いてください。"
      tips={[
        '再利用しやすい知見へ変換します。',
        '似た案件で使える場面も出します。',
        '保存タイトル案も出します。',
        '案件完了前後に向いています。',
      ]}
    />
  )
}