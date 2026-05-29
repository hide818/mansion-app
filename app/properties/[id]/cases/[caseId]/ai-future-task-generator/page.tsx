import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiFutureTaskGeneratorPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="future_task_generator"
        title="未来のタスク自動生成"
        description="今後2週間から1か月で必要になりそうなタスクを先回りで生成します。"
        inputLabel="先回りして見てほしいこと"
        placeholder="例）理事会提出、業者確認、居住者周知、工事日程調整まで含めて先に洗い出してほしいです。"
        submitLabel="未来タスクを出す"
        resultTitle="未来のタスク一覧"
      />
    </div>
  )
}