import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiLogAutoTagsPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="log_auto_tagging"
      title="AI ログ自動タグ付け"
      description="最近のログを、電話・メール・理事会・業者対応・社内共有などのタグで整理します。履歴の見返しやすさを上げるための機能です。"
      placeholder="特にタグ付けしたいログ本文や、補足したい対応メモがあればここへ貼ってください。"
      tips={[
        'ログ一覧を読み返しやすい形へ整理します。',
        'タグの偏りから案件の傾向も見ます。',
        '電話やメールが多い案件の可視化に向いています。',
        '手動ログだけでも使えます。',
      ]}
    />
  )
}