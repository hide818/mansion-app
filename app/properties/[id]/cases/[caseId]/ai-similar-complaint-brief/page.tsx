import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiSimilarComplaintBriefPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="similar_complaint_brief"
      title="AI 過去類似クレーム表示"
      description="同物件のクレーム履歴から、似た傾向や参考にできそうな対応パターンを拾います。再発防止や共有前に使いやすい機能です。"
      placeholder="今回のクレームの特徴や、似た事案がありそうだと感じる点があればここへ書いてください。"
      tips={[
        '似たクレーム候補を整理します。',
        '共通点と違いを分けて出します。',
        '参考にできそうな対応も拾います。',
        '共有用メモとして使いやすいです。',
      ]}
    />
  )
}