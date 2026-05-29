import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiKnowledgeSearchPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="knowledge_search"
        title="AI ナレッジ検索"
        description="案件・ログ・タスク・クレーム・ファイルの文脈から、今使えそうな知識を横断的に引っ張るための検索AIです。"
        inputLabel="探したい知識"
        placeholder="例）理事長への説明で通しやすい言い方、修繕案件で揉めにくい進め方、見積比較で見るポイントを探したいです。"
        buttonText="ナレッジを検索する"
        resultTitle="ナレッジ検索結果"
        tips={[
          '社内の勘や経験を検索っぽく使う方向です。',
          '属人化した知識を掘り出す入口になります。',
          '革命感が強い本命機能です。',
        ]}
      />
    </div>
  )
}