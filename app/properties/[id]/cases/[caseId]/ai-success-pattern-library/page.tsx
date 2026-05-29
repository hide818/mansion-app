import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiSuccessPatternLibraryPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="success_pattern_library"
        title="過去の成功対応パターン表示"
        description="この案件から学べる、うまく進みやすい対応パターンを抽出して表示します。"
        inputLabel="成功パターンとして見たいこと"
        placeholder="例）こういう案件で、どう動くとスムーズに進みやすいのか、再利用できる形で見たいです。"
        buttonText="成功パターンを出す"
        resultTitle="過去の成功対応パターン"
        tips={[
          '再現性のある動き方を拾うのに向いています。',
          '担当者ごとの勘に頼らない運用へ近づきます。',
          'SaaSの商品価値がかなり出やすい機能です。',
        ]}
      />
    </div>
  )
}