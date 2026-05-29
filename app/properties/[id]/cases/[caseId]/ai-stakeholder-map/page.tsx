import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiStakeholderMapPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="stakeholder_map"
        title="AI ステークホルダーマップ"
        description="この案件で重要な人物を整理し、誰にどう配慮すべきかを見える化します。"
        inputLabel="人物関係で気になること"
        placeholder="例）理事長は慎重派、申出者はやや強め、業者は返答が遅いです。誰を優先してどう動くべきか整理したいです。"
        buttonText="人物整理を作る"
        resultTitle="ステークホルダーマップ"
        tips={[
          '重要人物の関係性を整理できます。',
          '属人化しやすい人間関係メモ向けです。',
          '担当変更時の事故防止にかなり強いです。',
        ]}
      />
    </div>
  )
}