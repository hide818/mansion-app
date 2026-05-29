import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiKnowledgeCapturePage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="knowledge_capture"
        title="ナレッジ蓄積"
        description="この案件で得た学び、注意点、再利用できる判断軸をナレッジとして残す形に整理します。"
        inputLabel="残したい学びや気づき"
        placeholder="例）理事長の反応、業者比較で見たポイント、住民説明のコツを次回使えるよう残したいです。"
        buttonText="ナレッジを残す"
        resultTitle="ナレッジ蓄積メモ"
        tips={[
          '終わった案件を資産化する機能です。',
          '個人の経験を会社の知識へ変える方向に向いています。',
          '長く使うほど価値が積み上がるタイプです。',
        ]}
      />
    </div>
  )
}