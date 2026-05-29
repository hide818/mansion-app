import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiExpectedQuestionsPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="expected_questions_generator"
        title="想定質問生成"
        description="理事長、役員、居住者から飛んできそうな質問を先に洗い出し、短い回答例まで作ります。"
        inputLabel="特に警戒している質問"
        placeholder="例）なぜこの業者なのか、なぜ今やるのか、もっと安い方法はないのかを聞かれそうです。"
        submitLabel="質問を洗い出す"
        resultTitle="想定質問一覧"
      />
    </div>
  )
}