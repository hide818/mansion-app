import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiBoardQuestionPreviewPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="board_question_preview"
        title="AI 理事会で聞かれそうな質問表示"
        description="理事長や役員から出そうな質問を洗い出し、短い返答の骨子まで一緒に作ります。"
        inputLabel="特に警戒している質問"
        placeholder="例）金額の妥当性、業者選定理由、今やる必要性を聞かれそうです。厳しめで出してほしいです。"
        buttonText="質問を洗い出す"
        resultTitle="理事会で聞かれそうな質問"
        tips={[
          '理事会前の不安をかなり減らせます。',
          '質問だけでなく返しの方向性も作れます。',
          '理事会シミュレーション前の下準備にも向いています。',
        ]}
      />
    </div>
  )
}