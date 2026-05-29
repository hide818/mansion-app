import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiUnfinishedTaskBriefPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="unfinished_task_brief"
        title="AI 未完了タスク整理"
        description="未完了タスクだけを抜き出して、優先順と注意付きで整理します。"
        inputLabel="特に気になる未完了事項"
        placeholder="例）業者確認、理事会提出判断、居住者周知の抜けがないか見たいです。"
        buttonText="未完了タスクを整理する"
        resultTitle="未完了タスク整理"
        tips={[
          '残っている仕事だけを見やすく出します。',
          '引き継ぎ時の「何がまだ終わってないか」に強いです。',
          '優先順をつけた共有メモとして使えます。',
        ]}
      />
    </div>
  )
}