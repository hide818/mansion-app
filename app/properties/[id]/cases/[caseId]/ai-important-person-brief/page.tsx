import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiImportantPersonBriefPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="important_person_brief"
        title="AI 重要人物メモ"
        description="理事長、役員、申出者、業者など、この案件で外せない人物の要点を短く整理します。"
        inputLabel="特に見てほしい人物"
        placeholder="例）理事長の考え方、申出者の不満点、業者の癖を把握したいです。"
        buttonText="重要人物を整理する"
        resultTitle="重要人物メモ"
        tips={[
          '誰にどう配慮すべきかを見やすくします。',
          '属人化しやすい人間関係メモ向けです。',
          '担当変更時の価値が高いAIです。',
        ]}
      />
    </div>
  )
}