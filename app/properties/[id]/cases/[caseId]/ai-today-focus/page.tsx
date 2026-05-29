import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiTodayFocusPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="today_focus_extractor"
      title="AI 今日やること自動抽出"
      description="この案件で今日中に触るべきこと、後回しでよいこと、先に連絡したい相手を整理します。1日の動き方を決めるための機能です。"
      placeholder="今日特に気にしていること、今日中の締切、相手から急かされている内容があればここに書いてください。"
      tips={[
        '今日やることに絞って出します。',
        '後回しでよいことも分けて出します。',
        '最初に連絡すべき相手も提案します。',
        '朝の着手順を決める時に向いています。',
      ]}
    />
  )
}