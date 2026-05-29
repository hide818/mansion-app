import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiBoardMinutesGeneratorPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="board_minutes_generator"
        title="AI 議事録生成"
        description="案件情報や補足メモから、議事録に使いやすい自然な文章をAIで組み立てます。"
        inputLabel="議事録生成で補足したいこと"
        placeholder="例）今回は賛否が割れたので、議論の流れが分かる形で残したいです。結論もはっきり出したいです。"
        buttonText="AI議事録を作る"
        resultTitle="AI議事録生成結果"
        tips={[
          'ラフな内容から議事録調に整えられます。',
          '理事会後の共有文にも使えます。',
          '議事録作成機能より文章生成寄りです。',
        ]}
      />
    </div>
  )
}