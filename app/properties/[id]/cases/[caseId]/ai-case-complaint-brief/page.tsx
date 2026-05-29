import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiCaseComplaintBriefPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="case_complaint_brief"
      title="AI クレーム要約"
      description="クレーム性のある案件について、共有しやすい要約文を作ります。相手に配慮しつつ、現在の対応状況と再発防止の観点までまとめる機能です。"
      placeholder="クレームの経緯、相手の主張、今の困りごとなど、追加で共有したい内容があればここへ貼ってください。"
      tips={[
        '感情的にならない共有文を作ります。',
        '現在の対応状況を短く整理します。',
        '再発防止の観点まで出します。',
        '社内共有メモにも使いやすいです。',
      ]}
    />
  )
}