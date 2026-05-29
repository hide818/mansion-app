import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiCaseStoryBuilderPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="case_story_builder"
      title="AI 案件履歴ストーリー化"
      description="案件の流れを、途中参加の担当者でも一読で分かるストーリー形式へまとめます。属人化を減らすための機能です。"
      placeholder="特に転機になった出来事や、絶対に落としたくない背景があればここへ書いてください。"
      tips={[
        '案件の流れを文章でつなげて出します。',
        '重要な転機を拾って整理します。',
        '途中から見る人向けの理解が速くなります。',
        '引き継ぎサマリーとは別の角度で役立ちます。',
      ]}
    />
  )
}