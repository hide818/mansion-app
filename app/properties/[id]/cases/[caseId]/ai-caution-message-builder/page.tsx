import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiCautionMessageBuilderPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="caution_message_builder"
      title="AI 注意メッセージ生成"
      description="今この案件で共有しておくべき注意事項を、短く分かりやすい形で出します。"
      placeholder="今一番注意してほしいこと、見落としが怖い点、共有対象があればここへ書いてください。"
      tips={[
        '共有向けの短い注意文を作ります。',
        'なぜ今注意が必要かも出します。',
        '共有先ごとの言い方の差も出します。',
        '朝会や引き継ぎ共有に向いています。',
      ]}
    />
  )
}