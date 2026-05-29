import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiOneclickBoardReportPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="oneclick_board_report"
        title="AI ワンクリック理事会報告"
        description="案件情報・ログ・タスクを踏まえて、理事会へそのまま出しやすい報告文を一発で作ります。"
        inputLabel="理事会報告に特に入れたいこと"
        placeholder="例）今回決めてほしい点、現状の進捗、見積比較の要点を短く分かりやすく出したいです。"
        buttonText="理事会報告を作る"
        resultTitle="ワンクリック理事会報告"
        tips={[
          '理事会前の報告文づくりに向いています。',
          '長い履歴をそのまま理事会向けに整えやすいです。',
          '案件詳細からすぐ使える売れ筋機能です。',
        ]}
      />
    </div>
  )
}