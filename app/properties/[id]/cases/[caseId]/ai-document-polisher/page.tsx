import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiDocumentPolisherPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="document_polisher"
      title="AI 文書整形"
      description="書きかけの文、ラフなメモ、口語っぽい文章を、実務向きの自然な日本語へ整えます。社内外どちらにも使いやすい文へ直す機能です。"
      placeholder="整えたい本文をそのまま貼ってください。箇条書きでも、ラフな文章でも大丈夫です。"
      tips={[
        '意味はなるべく変えずに整えます。',
        '硬すぎない実務文へ寄せます。',
        'メール下書きや回覧文のたたき台に向いています。',
        'この機能は貼る本文が多いほど効きます。',
      ]}
    />
  )
}